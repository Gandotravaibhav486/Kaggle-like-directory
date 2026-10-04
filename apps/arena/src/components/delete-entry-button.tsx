'use client';

import { useActionState } from 'react';
import { ConfirmButton, FormErrors } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { deleteEntryAction } from '@/app/actions/boards';

export function DeleteEntryButton({ slug, boardSlug, entryId }: { slug: string; boardSlug: string; entryId: string }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => deleteEntryAction(slug, boardSlug, entryId),
    null,
  );
  return (
    <form action={formAction} className="inline">
      <ConfirmButton type="submit" variant="ghost" size="sm" confirmText="Delete this entry?">
        Delete
      </ConfirmButton>
      <FormErrors state={state} />
    </form>
  );
}
