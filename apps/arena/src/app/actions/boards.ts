'use server';

import { revalidatePath } from 'next/cache';
import { boardInputSchema, entryInputSchema, toFieldErrors, type ActionResult } from '@mi/db/domain';
import {
  addEntry,
  createBoard,
  deleteBoard,
  deleteEntry,
  getCompetitionBySlug,
  removeExampleEntries,
  updateBoard,
  updateEntry,
} from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { runAction } from '@/lib/action-helpers';

export async function createBoardAction(
  slug: string,
  _prev: ActionResult<{ boardSlug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ boardSlug: string }>> {
  return runAction(async () => {
    await requireOwner();
    const competition = await getCompetitionBySlug(db, slug);
    if (!competition) return { ok: false, formError: 'Season not found' };

    const parsed = boardInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    const board = await createBoard(db, competition.id, parsed.data);
    revalidatePath(`/competitions/${slug}/leaderboard`);
    return { ok: true, data: { boardSlug: board.slug } };
  });
}

export async function updateBoardAction(
  slug: string,
  boardId: string,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = boardInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await updateBoard(db, boardId, parsed.data);
    revalidatePath(`/competitions/${slug}/leaderboard`);
    revalidatePath(`/competitions/${slug}/leaderboard/${parsed.data.slug}`);
    return { ok: true, data: undefined, message: 'Saved' };
  });
}

export async function deleteBoardAction(slug: string, boardId: string): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    await deleteBoard(db, boardId);
    revalidatePath(`/competitions/${slug}/leaderboard`);
    return { ok: true, data: undefined };
  });
}

export async function addEntryAction(
  slug: string,
  boardSlug: string,
  boardId: string,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = entryInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await addEntry(db, boardId, parsed.data);
    revalidatePath(`/competitions/${slug}/leaderboard/${boardSlug}`);
    return { ok: true, data: undefined, message: 'Added' };
  });
}

export async function updateEntryAction(
  slug: string,
  boardSlug: string,
  entryId: string,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = entryInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await updateEntry(db, entryId, parsed.data);
    revalidatePath(`/competitions/${slug}/leaderboard/${boardSlug}`);
    return { ok: true, data: undefined, message: 'Saved' };
  });
}

export async function deleteEntryAction(
  slug: string,
  boardSlug: string,
  entryId: string,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    await deleteEntry(db, entryId);
    revalidatePath(`/competitions/${slug}/leaderboard/${boardSlug}`);
    return { ok: true, data: undefined };
  });
}

export async function removeAllExamplesAction(slug: string): Promise<ActionResult<{ removed: number }>> {
  return runAction(async () => {
    await requireOwner();
    const competition = await getCompetitionBySlug(db, slug);
    if (!competition) return { ok: false, formError: 'Season not found' };
    const removed = await removeExampleEntries(db, competition.id);
    revalidatePath(`/competitions/${slug}/leaderboard`);
    return { ok: true, data: { removed } };
  });
}
