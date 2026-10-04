'use server';

import { revalidatePath } from 'next/cache';
import { resourceInputSchema, toFieldErrors, type ActionResult } from '@mi/db/domain';
import {
  createResource,
  deleteResource as deleteResourceQuery,
  getCompetitionBySlug,
  updateResource,
} from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';

export async function saveResource(
  slug: string,
  id: string | null,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return { ok: false, formError: 'Only the owner can do this.' };
  }

  const parsed = resourceInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) return { ok: false, formError: 'Season not found.' };

  if (id) await updateResource(db, id, parsed.data);
  else await createResource(db, competition.id, parsed.data);

  revalidatePath(`/competitions/${slug}/data`);
  return { ok: true, data: undefined };
}

export async function deleteResource(id: string, slug: string): Promise<ActionResult> {
  try {
    await requireOwner();
  } catch {
    return { ok: false, formError: 'Only the owner can do this.' };
  }
  await deleteResourceQuery(db, id);
  revalidatePath(`/competitions/${slug}/data`);
  return { ok: true, data: undefined };
}
