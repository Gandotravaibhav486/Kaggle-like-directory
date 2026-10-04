import { and, asc, desc, eq } from 'drizzle-orm';
import type { Db } from '../client';
import type { ProspectRow } from '../domain/pipeline';
import type { ProspectInput } from '../domain/validation';
import { prospects, type Prospect } from '../schema';
import { NotFoundError } from './errors';

export function toProspectRow(p: Prospect): ProspectRow {
  return {
    id: p.id,
    company: p.company,
    contactName: p.contactName,
    contactEmail: p.contactEmail,
    channel: p.channel,
    emailedOn: p.emailedOn,
    repliedOn: p.repliedOn,
    demoOn: p.demoOn,
    secondCallOn: p.secondCallOn,
    wonOn: p.wonOn,
    lostOn: p.lostOn,
    contractValueMinor: p.contractValueMinor === null ? null : Number(p.contractValueMinor),
    note: p.note,
    example: p.example,
  };
}

/** OWNER ONLY callers. Most recent outreach first. */
export async function listProspects(db: Db, competitionId: string): Promise<ProspectRow[]> {
  const rows = await db
    .select()
    .from(prospects)
    .where(eq(prospects.competitionId, competitionId))
    .orderBy(desc(prospects.emailedOn), asc(prospects.company));
  return rows.map(toProspectRow);
}

/** Insert (no id) or update (id), scoped to the competition. */
export async function upsertProspect(
  db: Db,
  competitionId: string,
  input: ProspectInput,
  id?: string | null,
): Promise<ProspectRow> {
  if (id) {
    const [row] = await db
      .update(prospects)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(prospects.id, id), eq(prospects.competitionId, competitionId)))
      .returning();
    if (!row) throw new NotFoundError('Prospect');
    return toProspectRow(row);
  }
  const [row] = await db
    .insert(prospects)
    .values({ competitionId, ...input })
    .returning();
  return toProspectRow(row!);
}

export async function getProspect(db: Db, competitionId: string, id: string): Promise<ProspectRow | null> {
  const [row] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, id), eq(prospects.competitionId, competitionId)))
    .limit(1);
  return row ? toProspectRow(row) : null;
}

export async function deleteProspect(db: Db, competitionId: string, id: string): Promise<void> {
  await db.delete(prospects).where(and(eq(prospects.id, id), eq(prospects.competitionId, competitionId)));
}
