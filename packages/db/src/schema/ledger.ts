import { bigint, boolean, date, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id, updatedAt } from './_common';

const money = (name: string) => bigint(name, { mode: 'number' }).notNull().default(0);

export const ledgerMonths = pgTable(
  'ledger_months',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    /** Always the first day of the month, 'YYYY-MM-01'. */
    month: date('month', { mode: 'string' }).notNull(),
    revenueMinor: money('revenue_minor'),
    payingCustomers: integer('paying_customers').notNull().default(0),
    /** Invoice COUNTS, not amounts. */
    invoicesRaised: integer('invoices_raised').notNull().default(0),
    invoicesPaid: integer('invoices_paid').notNull().default(0),
    hostingMinor: money('hosting_minor'),
    speechMinor: money('speech_minor'),
    aiUsageMinor: money('ai_usage_minor'),
    otherMinor: money('other_minor'),
    note: text('note').notNull().default(''),
    sharedPublicly: boolean('shared_publicly').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique('ledger_months_competition_month_unique').on(t.competitionId, t.month)],
);

export type LedgerMonth = typeof ledgerMonths.$inferSelect;
export type NewLedgerMonth = typeof ledgerMonths.$inferInsert;
