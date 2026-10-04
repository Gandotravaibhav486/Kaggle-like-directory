import { and, asc, eq, ne } from 'drizzle-orm';
import type { Db } from '../client';
import { toPublicLedger, type LedgerMonthRow, type PublicLedgerMonth } from '../domain/public-ledger';
import type { LedgerMonthInput } from '../domain/validation';
import { ledgerMonths, type LedgerMonth } from '../schema';
import { DuplicateMonthError, isUniqueViolation, NotFoundError } from './errors';

export function toLedgerMonthRow(m: LedgerMonth): LedgerMonthRow {
  return {
    id: m.id,
    month: m.month,
    revenueMinor: Number(m.revenueMinor),
    payingCustomers: m.payingCustomers,
    invoicesRaised: m.invoicesRaised,
    invoicesPaid: m.invoicesPaid,
    hostingMinor: Number(m.hostingMinor),
    speechMinor: Number(m.speechMinor),
    aiUsageMinor: Number(m.aiUsageMinor),
    otherMinor: Number(m.otherMinor),
    note: m.note,
    sharedPublicly: m.sharedPublicly,
  };
}

/** OWNER ONLY callers. Months ascending. */
export async function listLedgerMonths(db: Db, competitionId: string): Promise<LedgerMonthRow[]> {
  const rows = await db
    .select()
    .from(ledgerMonths)
    .where(eq(ledgerMonths.competitionId, competitionId))
    .orderBy(asc(ledgerMonths.month));
  return rows.map(toLedgerMonthRow);
}

export async function getLedgerMonth(db: Db, id: string): Promise<LedgerMonthRow | null> {
  const [row] = await db.select().from(ledgerMonths).where(eq(ledgerMonths.id, id)).limit(1);
  return row ? toLedgerMonthRow(row) : null;
}

/** Insert (no id) or update (id). A second row for the same month throws DuplicateMonthError. */
export async function upsertLedgerMonth(
  db: Db,
  competitionId: string,
  input: LedgerMonthInput,
  id?: string | null,
): Promise<LedgerMonthRow> {
  const month = `${input.month.slice(0, 7)}-01`;
  const values = {
    month,
    revenueMinor: input.revenueMinor,
    payingCustomers: input.payingCustomers,
    invoicesRaised: input.invoicesRaised,
    invoicesPaid: input.invoicesPaid,
    hostingMinor: input.hostingMinor,
    speechMinor: input.speechMinor,
    aiUsageMinor: input.aiUsageMinor,
    otherMinor: input.otherMinor,
    note: input.note ?? '',
    sharedPublicly: input.sharedPublicly ?? false,
  };
  const dupWhere = and(
    eq(ledgerMonths.competitionId, competitionId),
    eq(ledgerMonths.month, month),
    ...(id ? [ne(ledgerMonths.id, id)] : []),
  );
  const [dup] = await db.select({ id: ledgerMonths.id }).from(ledgerMonths).where(dupWhere).limit(1);
  if (dup) throw new DuplicateMonthError(input.month);
  try {
    if (id) {
      const [row] = await db
        .update(ledgerMonths)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(ledgerMonths.id, id), eq(ledgerMonths.competitionId, competitionId)))
        .returning();
      if (!row) throw new NotFoundError('Ledger month');
      return toLedgerMonthRow(row);
    }
    const [row] = await db
      .insert(ledgerMonths)
      .values({ competitionId, ...values })
      .returning();
    return toLedgerMonthRow(row!);
  } catch (err) {
    if (isUniqueViolation(err)) throw new DuplicateMonthError(input.month);
    throw err;
  }
}

export async function deleteLedgerMonth(db: Db, id: string): Promise<void> {
  await db.delete(ledgerMonths).where(eq(ledgerMonths.id, id));
}

export async function setLedgerMonthShared(db: Db, id: string, shared: boolean): Promise<void> {
  await db.update(ledgerMonths).set({ sharedPublicly: shared, updatedAt: new Date() }).where(eq(ledgerMonths.id, id));
}

/**
 * Public projection. Selects only month, revenue_minor and paying_customers of shared months,
 * then passes them through toPublicLedger(). Never selects expense columns.
 */
export async function getPublicLedger(db: Db, competitionId: string): Promise<PublicLedgerMonth[]> {
  const rows = await db
    .select({
      month: ledgerMonths.month,
      revenueMinor: ledgerMonths.revenueMinor,
      payingCustomers: ledgerMonths.payingCustomers,
      sharedPublicly: ledgerMonths.sharedPublicly,
    })
    .from(ledgerMonths)
    .where(and(eq(ledgerMonths.competitionId, competitionId), eq(ledgerMonths.sharedPublicly, true)));
  return toPublicLedger(rows);
}
