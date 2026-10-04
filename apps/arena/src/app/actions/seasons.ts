'use server';

import { redirect } from 'next/navigation';
import { seasonInputSchema, toFieldErrors, type ActionResult } from '@mi/db/domain';
import { createSeason } from '@mi/db/queries';
import { importSeason } from '@mi/db/season';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { runAction } from '@/lib/action-helpers';

export async function createSeasonAction(
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  const result = await runAction(async () => {
    const viewer = await requireOwner();
    const parsed = seasonInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
    const competition = await createSeason(db, parsed.data, viewer.email ?? 'owner');
    return { ok: true, data: undefined, message: competition.slug };
  });
  if (result.ok) redirect(`/competitions/${result.message}/overview`);
  return result;
}

export async function importSeasonAction(
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  const result = await runAction(async () => {
    const viewer = await requireOwner();
    const newSlug = String(formData.get('newSlug') ?? '').trim();
    const newTitle = String(formData.get('newTitle') ?? '').trim() || undefined;
    const raw = String(formData.get('json') ?? '');
    if (raw.length > 5 * 1024 * 1024) {
      return { ok: false, formError: 'That file is too large (5 MB max).' };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, formError: 'That is not valid JSON.' };
    }
    const result = await importSeason(db, parsed, { newSlug, newTitle, actorEmail: viewer.email ?? 'owner' });
    if (!result.ok) {
      return { ok: false, formError: result.error, fieldErrors: result.issues ? { _form: result.issues } : undefined };
    }
    return { ok: true, data: undefined, message: result.competition.slug };
  });
  if (result.ok) redirect(`/competitions/${result.message}/overview`);
  return result;
}
