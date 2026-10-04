'use server';

import { revalidatePath } from 'next/cache';
import {
  fromMinor,
  nextStage,
  prospectInputSchema,
  toFieldErrors,
  type ActionResult,
  type ProspectRow,
} from '@mi/db/domain';
import { deleteProspect, getCompetitionBySlug, getProspect, upsertProspect } from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { runAction } from '@/lib/action-helpers';

/** Server-local calendar date, 'YYYY-MM-DD'. */
function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** A stored prospect as form-shaped input, so stage changes go through the same validation as the form. */
function toFormInput(p: ProspectRow) {
  return {
    ...p,
    contractValue: p.contractValueMinor === null ? '' : fromMinor(p.contractValueMinor).toFixed(2),
  };
}

async function competitionFor(slug: string) {
  await requireOwner();
  return getCompetitionBySlug(db, slug);
}

export async function saveProspect(
  slug: string,
  id: string | null,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    const competition = await competitionFor(slug);
    if (!competition) return { ok: false, formError: 'Season not found' };

    const parsed = prospectInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await upsertProspect(db, competition.id, parsed.data, id ?? undefined);
    revalidatePath(`/competitions/${slug}/pipeline`);
    return { ok: true, data: undefined, message: 'Saved' };
  });
}

/** Moves an open prospect to its next stage (or marks it lost), dated today. */
export async function moveProspect(
  slug: string,
  id: string,
  to: 'next' | 'lost',
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    const competition = await competitionFor(slug);
    if (!competition) return { ok: false, formError: 'Season not found' };
    const prospect = await getProspect(db, competition.id, id);
    if (!prospect) return { ok: false, formError: 'Prospect not found' };

    const stage = nextStage(prospect);
    if (!stage) return { ok: false, formError: 'This prospect is already closed' };
    const field = to === 'lost' ? 'lostOn' : stage.field;

    const parsed = prospectInputSchema.safeParse({ ...toFormInput(prospect), [field]: today() });
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await upsertProspect(db, competition.id, parsed.data, id);
    revalidatePath(`/competitions/${slug}/pipeline`);
    return { ok: true, data: undefined };
  });
}

export async function deleteProspectAction(slug: string, id: string): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    const competition = await competitionFor(slug);
    if (!competition) return { ok: false, formError: 'Season not found' };
    await deleteProspect(db, competition.id, id);
    revalidatePath(`/competitions/${slug}/pipeline`);
    return { ok: true, data: undefined };
  });
}
