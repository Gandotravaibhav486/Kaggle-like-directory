import { and, asc, count, desc, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '../client';
import type { AgentSource } from '../domain/types';
import type { AgentReplyPayload, ReplyInput, ThreadInput } from '../domain/validation';
import { competitions, replies, threads, type Reply, type Thread } from '../schema';
import { NotFoundError } from './errors';

export interface ThreadSummary {
  id: string;
  competitionId: string;
  title: string;
  tag: string;
  authorName: string;
  createdAt: Date;
  lastActivityAt: Date;
  /** Visible (not hidden) replies. */
  replyCount: number;
}

const summaryFields = {
  id: threads.id,
  competitionId: threads.competitionId,
  title: threads.title,
  tag: threads.tag,
  authorName: threads.authorName,
  createdAt: threads.createdAt,
  lastActivityAt: threads.lastActivityAt,
  replyCount: sql<number>`(select count(*)::int from "replies" r where r.thread_id = "threads"."id" and r.hidden = false)`.mapWith(
    Number,
  ),
};

/** Last activity first. */
export async function listThreads(
  db: Db,
  competitionId: string,
  opts: { limit?: number } = {},
): Promise<ThreadSummary[]> {
  const q = db
    .select(summaryFields)
    .from(threads)
    .where(eq(threads.competitionId, competitionId))
    .orderBy(desc(threads.lastActivityAt), desc(threads.createdAt));
  return opts.limit ? q.limit(opts.limit) : q;
}

/** Used by the arena overview ("Latest from the lab"). */
export async function listLatestThreads(db: Db, competitionSlug: string, limit = 3): Promise<ThreadSummary[]> {
  return db
    .select(summaryFields)
    .from(threads)
    .innerJoin(competitions, eq(competitions.id, threads.competitionId))
    .where(eq(competitions.slug, competitionSlug))
    .orderBy(desc(threads.lastActivityAt), desc(threads.createdAt))
    .limit(limit);
}

export async function getThread(db: Db, threadId: string): Promise<Thread | null> {
  const [row] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  return row ?? null;
}

/**
 * Oldest first. When !includeHidden, hidden replies are still returned (so the UI can show a
 * placeholder) but their body, payload and model are stripped.
 */
export async function listReplies(db: Db, threadId: string, opts: { includeHidden: boolean }): Promise<Reply[]> {
  const rows = await db
    .select()
    .from(replies)
    .where(eq(replies.threadId, threadId))
    .orderBy(asc(replies.createdAt), asc(replies.id));
  if (opts.includeHidden) return rows;
  return rows.map((r) => (r.hidden ? { ...r, bodyMd: '', agentPayload: null, model: null } : r));
}

export async function createThread(
  db: Db,
  competitionId: string,
  input: Pick<ThreadInput, 'title' | 'tag' | 'bodyMd' | 'authorName'>,
  authorUserId?: string | null,
): Promise<Thread> {
  const [row] = await db
    .insert(threads)
    .values({
      competitionId,
      title: input.title,
      tag: input.tag,
      bodyMd: input.bodyMd,
      authorName: input.authorName,
      authorUserId: authorUserId ?? null,
    })
    .returning();
  return row!;
}

async function touchThread(db: Db, threadId: string) {
  await db.update(threads).set({ lastActivityAt: new Date() }).where(eq(threads.id, threadId));
}

export async function createPersonReply(
  db: Db,
  threadId: string,
  input: Pick<ReplyInput, 'bodyMd' | 'authorName'>,
  authorUserId?: string | null,
): Promise<Reply> {
  if (!(await getThread(db, threadId))) throw new NotFoundError('Thread');
  const [row] = await db
    .insert(replies)
    .values({
      threadId,
      authorType: 'person',
      authorName: input.authorName,
      authorUserId: authorUserId ?? null,
      bodyMd: input.bodyMd,
      createdAt: sql`clock_timestamp()`,
    })
    .returning();
  await touchThread(db, threadId);
  return row!;
}

export async function createAgentReply(
  db: Db,
  args: {
    threadId: string;
    agentName: string;
    source: AgentSource;
    payload: AgentReplyPayload;
    model?: string | null;
    isMock?: boolean;
    agentTokenId?: string | null;
  },
): Promise<Reply> {
  if (!(await getThread(db, args.threadId))) throw new NotFoundError('Thread');
  const [row] = await db
    .insert(replies)
    .values({
      threadId: args.threadId,
      authorType: 'agent',
      authorName: args.agentName,
      bodyMd: '',
      agentSource: args.source,
      agentPayload: args.payload,
      agentTokenId: args.agentTokenId ?? null,
      model: args.model ?? null,
      isMock: args.isMock ?? false,
      createdAt: sql`clock_timestamp()`,
    })
    .returning();
  await touchThread(db, args.threadId);
  return row!;
}

export async function getReply(db: Db, replyId: string): Promise<Reply | null> {
  const [row] = await db.select().from(replies).where(eq(replies.id, replyId)).limit(1);
  return row ?? null;
}

export async function setReplyHidden(db: Db, replyId: string, hidden: boolean): Promise<void> {
  await db
    .update(replies)
    .set({ hidden, hiddenAt: hidden ? new Date() : null })
    .where(eq(replies.id, replyId));
}

/** Most recent Claude-button reply on a thread (mock included). */
export async function lastClaudeReplyAt(db: Db, threadId: string): Promise<Date | null> {
  const [row] = await db
    .select({ at: replies.createdAt })
    .from(replies)
    .where(and(eq(replies.threadId, threadId), eq(replies.agentSource, 'claude_button')))
    .orderBy(desc(replies.createdAt))
    .limit(1);
  return row?.at ?? null;
}

/** Site-wide count of Claude-button replies since a time (mock included). */
export async function countClaudeRepliesSince(db: Db, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(replies)
    .where(and(eq(replies.agentSource, 'claude_button'), gte(replies.createdAt, since)));
  return Number(row?.n ?? 0);
}
