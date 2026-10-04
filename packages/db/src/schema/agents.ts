import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { competitions } from './competitions';
import { createdAt, id } from './_common';

export const agentTokens = pgTable(
  'agent_tokens',
  {
    id: id(),
    competitionId: text('competition_id')
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    /** The agent display name. */
    name: text('name').notNull(),
    /** sha256 hex of the plaintext token. */
    tokenHash: text('token_hash').notNull().unique(),
    /** First 12 chars of the plaintext, for display only. */
    tokenPrefix: text('token_prefix').notNull(),
    rateLimit: integer('rate_limit').notNull().default(10),
    rateWindowSeconds: integer('rate_window_seconds').notNull().default(60),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true, mode: 'date' }),
    windowCount: integer('window_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    createdBy: text('created_by'),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => [index('agent_tokens_competition_idx').on(t.competitionId)],
);

export type AgentToken = typeof agentTokens.$inferSelect;
export type NewAgentToken = typeof agentTokens.$inferInsert;
