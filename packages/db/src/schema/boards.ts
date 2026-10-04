import { sql } from 'drizzle-orm';
import { boolean, check, date, doublePrecision, index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id, updatedAt } from './_common';

export const boards = pgTable(
  'boards',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    objective: text('objective').notNull(),
    unit: text('unit').notNull(),
    direction: text('direction', { enum: ['higher', 'lower'] }).notNull(),
    target: doublePrecision('target'),
    period: text('period').notNull(),
    source: text('source', { enum: ['manual', 'ledger_revenue'] }).notNull().default('manual'),
    decimals: integer('decimals').notNull().default(2),
    position: integer('position').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique('boards_competition_slug_unique').on(t.competitionId, t.slug)],
);

export const boardEntries = pgTable(
  'board_entries',
  {
    id: id(),
    boardId: text('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    value: doublePrecision('value').notNull(),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    sourceNote: text('source_note').notNull(),
    evidenceUrl: text('evidence_url'),
    example: boolean('example').notNull().default(false),
    seedKey: text('seed_key').unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('board_entries_source_note_not_blank', sql`length(trim(${t.sourceNote})) > 0`),
    index('board_entries_board_idx').on(t.boardId),
  ],
);

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type BoardEntry = typeof boardEntries.$inferSelect;
export type NewBoardEntry = typeof boardEntries.$inferInsert;
