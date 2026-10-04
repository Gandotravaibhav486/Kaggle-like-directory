'use server';

import { revalidatePath } from 'next/cache';
import { ledgerMonthInputSchema, toFieldErrors, type ActionResult } from '@mi/db/domain';
import {
  deleteLedgerMonth,
  getCompetitionBySlug,
  setLedgerMonthShared,
  upsertLedgerMonth,
} from '@mi/db/queries';
import { db } from '@/lib/db';
import { requireOwner } from '@/lib/guards';
import { runAction } from '@/lib/action-helpers';

export async function saveLedgerMonth(
  slug: string,
  id: string | null,
  _prev: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    const competition = await getCompetitionBySlug(db, slug);
    if (!competition) return { ok: false, formError: 'Season not found' };

    const parsed = ledgerMonthInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

    await upsertLedgerMonth(db, competition.id, parsed.data, id ?? undefined);
    revalidatePath(`/competitions/${slug}/ledger`);
    revalidatePath(`/competitions/${slug}/leaderboard/monthly-revenue`);
    return { ok: true, data: undefined, message: 'Saved' };
  });
}

export async function deleteLedgerMonthAction(slug: string, id: string): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    await deleteLedgerMonth(db, id);
    revalidatePath(`/competitions/${slug}/ledger`);
    revalidatePath(`/competitions/${slug}/leaderboard/monthly-revenue`);
    return { ok: true, data: undefined };
  });
}

export async function setLedgerShared(slug: string, id: string, shared: boolean): Promise<ActionResult<undefined>> {
  return runAction(async () => {
    await requireOwner();
    await setLedgerMonthShared(db, id, shared);
    revalidatePath(`/competitions/${slug}/ledger`);
    revalidatePath(`/competitions/${slug}/leaderboard/monthly-revenue`);
    return { ok: true, data: undefined };
  });
}
