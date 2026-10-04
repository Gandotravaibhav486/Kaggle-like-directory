'use server';

import { revalidatePath } from 'next/cache';
import {
  agentTokenInputSchema,
  buildAgentBriefing,
  pastedAgentReplySchema,
  toFieldErrors,
  type ActionResult,
  type BriefingInput,
} from '@mi/db/domain';
import {
  countClaudeRepliesSince,
  createAgentReply,
  createAgentToken,
  getCompetitionById,
  getCompetitionBySlug,
  getThread,
  lastClaudeReplyAt,
  listReplies,
  listResources,
  revokeAgentToken as revokeAgentTokenQuery,
} from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { claudeStatus, generateObservations, type ClaudeResult } from '@/lib/claude';

const CLAUDE_THREAD_COOLDOWN_MS = 60_000;
const CLAUDE_SITE_WIDE_LIMIT = 30;
const CLAUDE_SITE_WIDE_WINDOW_MS = 60 * 60 * 1000;

async function buildBriefingInput(threadId: string): Promise<BriefingInput | null> {
  const thread = await getThread(db, threadId);
  if (!thread) return null;
  const competition = await getCompetitionById(db, thread.competitionId);
  const resources = await listResources(db, thread.competitionId);
  const replies = await listReplies(db, threadId, { includeHidden: false });
  return {
    competition: { slug: competition?.slug ?? '', title: competition?.title ?? '' },
    resources: resources.map((r) => ({ name: r.name, kind: r.kind, usedFor: r.usedFor, notes: r.notes, url: r.url })),
    thread: {
      title: thread.title,
      tag: thread.tag,
      bodyMd: thread.bodyMd,
      authorName: thread.authorName,
      createdAt: thread.createdAt.toISOString(),
    },
    replies: replies
      .filter((r) => !r.hidden)
      .map((r) => ({
        authorType: r.authorType as 'person' | 'agent',
        authorName: r.authorName,
        text: r.authorType === 'agent' && r.agentPayload ? JSON.stringify(r.agentPayload) : r.bodyMd,
        createdAt: r.createdAt.toISOString(),
      })),
  };
}

export async function requestClaudeObservations(threadId: string): Promise<ClaudeResult> {
  const status = claudeStatus();
  if (!status.configured) return { configured: false };

  const since = new Date(Date.now() - CLAUDE_SITE_WIDE_WINDOW_MS);
  const [lastAt, siteCount] = await Promise.all([
    lastClaudeReplyAt(db, threadId),
    countClaudeRepliesSince(db, since),
  ]);
  if (lastAt && Date.now() - lastAt.getTime() < CLAUDE_THREAD_COOLDOWN_MS) {
    return { configured: true, ok: false, error: 'Please wait before asking again.' };
  }
  if (siteCount >= CLAUDE_SITE_WIDE_LIMIT) {
    return { configured: true, ok: false, error: 'Please wait before asking again.' };
  }

  const input = await buildBriefingInput(threadId);
  if (!input) return { configured: true, ok: false, error: 'Thread not found.' };

  try {
    const { payload, model, mock } = await generateObservations(input);
    const reply = await createAgentReply(db, {
      threadId,
      agentName: mock ? 'Claude (mock)' : 'Claude',
      source: 'claude_button',
      payload,
      model,
      isMock: mock,
    });
    revalidatePath('/', 'layout');
    return { configured: true, ok: true, replyId: reply.id, mock };
  } catch (err) {
    const httpStatus = (err as { status?: number })?.status;
    console.error('Claude observations request failed', err);
    return {
      configured: true,
      ok: false,
      error: httpStatus ? `Claude request failed (${httpStatus}).` : 'Claude request failed.',
    };
  }
}

export async function buildBriefingText(threadId: string): Promise<string> {
  const input = await buildBriefingInput(threadId);
  if (!input) return '';
  return buildAgentBriefing(input);
}

export async function postPastedAgentReply(
  threadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    agentName: formData.get('agentName'),
    observations: String(formData.get('observations') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    suggestions: String(formData.get('suggestions') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const [suggestion, ...rest] = line.split('|');
        return { suggestion: (suggestion ?? '').trim(), reason: rest.join('|').trim() };
      }),
    biggestRisk: formData.get('biggestRisk'),
    missingInformation: String(formData.get('missingInformation') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const parsed = pastedAgentReplySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const thread = await getThread(db, threadId);
  if (!thread) return { ok: false, formError: 'Thread not found.' };

  const { agentName, ...payload } = parsed.data;
  await createAgentReply(db, { threadId, agentName, source: 'pasted', payload });
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

export async function createAgentTokenAction(
  slug: string,
  _prev: ActionResult<{ plaintext: string; prefix: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ plaintext: string; prefix: string }>> {
  const viewer = await requireOwner().catch(() => null);
  if (!viewer) return { ok: false, formError: 'Only the owner can do this.' };

  const parsed = agentTokenInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) return { ok: false, formError: 'Season not found.' };

  const { token, plaintext } = await createAgentToken(db, competition.id, parsed.data, viewer.email ?? 'owner');
  revalidatePath(`/competitions/${slug}/agents`);
  return { ok: true, data: { plaintext, prefix: token.tokenPrefix } };
}

export async function revokeAgentTokenAction(tokenId: string): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return { ok: false, formError: 'Only the owner can do this.' };
  }
  await revokeAgentTokenQuery(db, tokenId);
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}
