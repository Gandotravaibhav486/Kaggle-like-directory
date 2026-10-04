import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { generateAgentToken, hashAgentToken } from '../domain/tokens';
import type { AgentTokenInput } from '../domain/validation';
import { agentTokens } from '../schema';

/** Safe to show in the UI: never includes the hash. */
export interface AgentTokenPublic {
  id: string;
  competitionId: string;
  name: string;
  tokenPrefix: string;
  rateLimit: number;
  rateWindowSeconds: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  revokedAt: Date | null;
}

/** Returned by authenticateAgentToken (no hash). */
export type AgentTokenRecord = AgentTokenPublic;

const publicFields = {
  id: agentTokens.id,
  competitionId: agentTokens.competitionId,
  name: agentTokens.name,
  tokenPrefix: agentTokens.tokenPrefix,
  rateLimit: agentTokens.rateLimit,
  rateWindowSeconds: agentTokens.rateWindowSeconds,
  lastUsedAt: agentTokens.lastUsedAt,
  createdAt: agentTokens.createdAt,
  createdBy: agentTokens.createdBy,
  revokedAt: agentTokens.revokedAt,
};

/** Returns the plaintext exactly once; only the sha256 hash is stored. */
export async function createAgentToken(
  db: Db,
  competitionId: string,
  input: AgentTokenInput,
  actorEmail: string,
): Promise<{ token: AgentTokenPublic; plaintext: string }> {
  const { plaintext, hash, prefix } = generateAgentToken();
  const [token] = await db
    .insert(agentTokens)
    .values({
      competitionId,
      name: input.name,
      tokenHash: hash,
      tokenPrefix: prefix,
      rateLimit: input.rateLimit ?? 10,
      rateWindowSeconds: input.rateWindowSeconds ?? 60,
      createdBy: actorEmail,
    })
    .returning(publicFields);
  return { token: token!, plaintext };
}

export async function listAgentTokens(db: Db, competitionId: string): Promise<AgentTokenPublic[]> {
  return db
    .select(publicFields)
    .from(agentTokens)
    .where(eq(agentTokens.competitionId, competitionId))
    .orderBy(desc(agentTokens.createdAt));
}

export async function revokeAgentToken(db: Db, id: string): Promise<void> {
  await db
    .update(agentTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(agentTokens.id, id), isNull(agentTokens.revokedAt)));
}

/** Looks the token up by hash. null when unknown or revoked. */
export async function authenticateAgentToken(db: Db, plaintext: string): Promise<AgentTokenRecord | null> {
  if (!plaintext) return null;
  const [row] = await db
    .select(publicFields)
    .from(agentTokens)
    .where(eq(agentTokens.tokenHash, hashAgentToken(plaintext)))
    .limit(1);
  if (!row || row.revokedAt) return null;
  return row;
}

/** Atomic fixed-window rate limit (single UPDATE ... RETURNING, no loop). */
export async function consumeRateLimit(
  db: Db,
  tokenId: string,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const expired = sql`(${agentTokens.windowStartedAt} IS NULL OR ${agentTokens.windowStartedAt} <= now() - make_interval(secs => ${agentTokens.rateWindowSeconds}))`;
  const [row] = await db
    .update(agentTokens)
    .set({
      windowCount: sql`CASE WHEN ${expired} THEN 1 ELSE ${agentTokens.windowCount} + 1 END`,
      windowStartedAt: sql`CASE WHEN ${expired} THEN now() ELSE ${agentTokens.windowStartedAt} END`,
      lastUsedAt: sql`now()`,
    })
    .where(and(eq(agentTokens.id, tokenId), isNull(agentTokens.revokedAt)))
    .returning({
      windowCount: agentTokens.windowCount,
      rateLimit: agentTokens.rateLimit,
      secondsLeft: sql<number>`extract(epoch from (${agentTokens.windowStartedAt} + make_interval(secs => ${agentTokens.rateWindowSeconds}) - now()))`.mapWith(
        Number,
      ),
    });
  if (!row) return { allowed: false, remaining: 0, retryAfterSeconds: 0 };
  const allowed = row.windowCount <= row.rateLimit;
  return {
    allowed,
    remaining: Math.max(0, row.rateLimit - row.windowCount),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil(row.secondsLeft)),
  };
}
