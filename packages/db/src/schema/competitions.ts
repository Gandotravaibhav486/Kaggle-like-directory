import { date, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './_common';

export const competitions = pgTable('competitions', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull().default(''),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  startsOn: date('starts_on', { mode: 'string' }),
  endsOn: date('ends_on', { mode: 'string' }),
  currency: text('currency').notNull().default('INR'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
