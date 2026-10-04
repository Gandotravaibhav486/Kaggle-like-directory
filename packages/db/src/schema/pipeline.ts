import { bigint, boolean, date, index, pgTable, text } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id, updatedAt } from './_common';

const stageDate = (name: string) => date(name, { mode: 'string' });

/**
 * One row per B2B prospect in the sales pipeline (owner only, never public, never exported).
 * The stage is derived from which dates are set: a prospect has reached a stage when that
 * stage's date, or any later stage's date, is set. `lostOn` closes the prospect at any stage.
 */
export const prospects = pgTable(
  'prospects',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    contactName: text('contact_name').notNull().default(''),
    contactEmail: text('contact_email'),
    channel: text('channel').notNull().default(''),
    emailedOn: stageDate('emailed_on').notNull(),
    repliedOn: stageDate('replied_on'),
    demoOn: stageDate('demo_on'),
    secondCallOn: stageDate('second_call_on'),
    wonOn: stageDate('won_on'),
    lostOn: stageDate('lost_on'),
    contractValueMinor: bigint('contract_value_minor', { mode: 'number' }),
    note: text('note').notNull().default(''),
    example: boolean('example').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('prospects_competition_idx').on(t.competitionId, t.emailedOn)],
);

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
