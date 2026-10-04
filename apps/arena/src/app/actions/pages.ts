'use server';

import { revalidatePath } from 'next/cache';
import { pageBodySchema, type ActionResult, type PageKind } from '@mi/db/domain';
import { getCompetitionBySlug, getPage, restorePageRevision, savePageBody } from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { runAction } from '@/lib/action-helpers';

export async function savePage(
  slug: string,
  kind: PageKind,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    const viewer = await requireOwner();
    const competition = await getCompetitionBySlug(db, slug);
    if (!competition) return { ok: false, formError: 'Season not found' };
    const page = await getPage(db, competition.id, kind);
    if (!page) return { ok: false, formError: 'Page not found' };

    const parsed = pageBodySchema.safeParse(formData.get('bodyMd') ?? '');
    if (!parsed.success) {
      return { ok: false, fieldErrors: { bodyMd: parsed.error.issues.map((i) => i.message) } };
    }

    await savePageBody(db, { pageId: page.id, bodyMd: parsed.data, actorEmail: viewer.email ?? 'owner' });
    revalidatePath(`/competitions/${slug}/${kind}`);
    revalidatePath(`/competitions/${slug}/history/${kind}`);
    return { ok: true, data: undefined, message: 'Saved' };
  });
}

export async function restoreRevision(
  slug: string,
  kind: PageKind,
  revision: number,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    const viewer = await requireOwner();
    const competition = await getCompetitionBySlug(db, slug);
    if (!competition) return { ok: false, formError: 'Season not found' };
    const page = await getPage(db, competition.id, kind);
    if (!page) return { ok: false, formError: 'Page not found' };

    await restorePageRevision(db, { pageId: page.id, revision, actorEmail: viewer.email ?? 'owner' });
    revalidatePath(`/competitions/${slug}/${kind}`);
    revalidatePath(`/competitions/${slug}/history/${kind}`);
    return { ok: true, data: undefined, message: 'Restored' };
  });
}
