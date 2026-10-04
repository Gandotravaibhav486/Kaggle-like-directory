import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id } from './_common';

export const pages = pgTable(
  'pages',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['overview', 'description', 'evaluation', 'rules', 'timeline'] }).notNull(),
    bodyMd: text('body_md').notNull().default(''),
    currentRevision: integer('current_revision').notNull().default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedBy: text('updated_by'),
  },
  (t) => [unique('pages_competition_kind_unique').on(t.competitionId, t.kind)],
);

export const pageRevisions = pgTable(
  'page_revisions',
  {
    id: id(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    bodyMd: text('body_md').notNull().default(''),
    note: text('note'),
    restoredFromRevision: integer('restored_from_revision'),
    createdAt: createdAt(),
    createdBy: text('created_by'),
  },
  (t) => [unique('page_revisions_page_revision_unique').on(t.pageId, t.revision)],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageRevision = typeof pageRevisions.$inferSelect;
export type NewPageRevision = typeof pageRevisions.$inferInsert;
