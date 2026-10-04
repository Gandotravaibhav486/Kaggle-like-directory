'use server';

import { revalidatePath } from 'next/cache';
import {
  replyInputSchema,
  threadInputSchema,
  toFieldErrors,
  type ActionResult,
} from '@mi/db/domain';
import {
  createPersonReply,
  createThread as createThreadQuery,
  getCompetitionBySlug,
  getThread,
  setReplyHidden as setReplyHiddenQuery,
} from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer, requireOwner } from '@/lib/guards';

export async function createThread(
  slug: string,
  _prev: ActionResult<{ threadId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ threadId: string }>> {
  const parsed = threadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) return { ok: false, formError: 'Season not found.' };

  const viewer = await getViewer();
  const thread = await createThreadQuery(db, competition.id, parsed.data, viewer.signedIn ? undefined : null);
  revalidatePath(`/competitions/${slug}/discussion`);
  return { ok: true, data: { threadId: thread.id } };
}

export async function createReply(
  threadId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = replyInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const thread = await getThread(db, threadId);
  if (!thread) return { ok: false, formError: 'Thread not found.' };

  const viewer = await getViewer();
  await createPersonReply(db, threadId, parsed.data, viewer.signedIn ? undefined : null);
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

export async function setReplyHidden(replyId: string, hidden: boolean): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return { ok: false, formError: 'Only the owner can do this.' };
  }
  await setReplyHiddenQuery(db, replyId, hidden);
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}
