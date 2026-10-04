import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id, updatedAt } from './_common';

export const resources = pgTable(
  'resources',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['model', 'service', 'dataset', 'tool', 'platform', 'channel'] }).notNull(),
    url: text('url'),
    usedFor: text('used_for').notNull(),
    /** Limits, licence, cost. */
    notes: text('notes').notNull().default(''),
    position: integer('position').notNull().default(0),
    seedKey: text('seed_key').unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('resources_competition_idx').on(t.competitionId)],
);

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
