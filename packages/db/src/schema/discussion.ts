import { sql } from 'drizzle-orm';
import { boolean, check, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { AgentReplyPayload } from '../domain/validation';
import { agentTokens } from './agents';
import { users } from './auth';
import { competitions } from './competitions';
import { createdAt, id, updatedAt } from './_common';

export const threads = pgTable(
  'threads',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    tag: text('tag').notNull(),
    bodyMd: text('body_md').notNull().default(''),
    authorName: text('author_name').notNull(),
    authorUserId: text('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    seedKey: text('seed_key').unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('threads_competition_activity_idx').on(t.competitionId, t.lastActivityAt)],
);

export const replies = pgTable(
  'replies',
  {
    id: id(),
    threadId: text('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    authorType: text('author_type', { enum: ['person', 'agent'] }).notNull(),
    authorName: text('author_name').notNull(),
    authorUserId: text('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    bodyMd: text('body_md').notNull().default(''),
    agentSource: text('agent_source', { enum: ['claude_button', 'pasted', 'api'] }),
    agentPayload: jsonb('agent_payload').$type<AgentReplyPayload>(),
    agentTokenId: text('agent_token_id').references(() => agentTokens.id, { onDelete: 'set null' }),
    model: text('model'),
    isMock: boolean('is_mock').notNull().default(false),
    hidden: boolean('hidden').notNull().default(false),
    hiddenAt: timestamp('hidden_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      'replies_agent_requires_payload',
      sql`${t.authorType} <> 'agent' OR (${t.agentPayload} IS NOT NULL AND ${t.agentSource} IS NOT NULL)`,
    ),
    index('replies_thread_created_idx').on(t.threadId, t.createdAt),
  ],
);

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
