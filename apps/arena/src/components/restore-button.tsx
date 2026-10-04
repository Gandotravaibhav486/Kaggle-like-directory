'use client';

import { useActionState } from 'react';
import { ConfirmButton, FormErrors } from '@mi/ui/client';
import { useFormStatus } from 'react-dom';
import type { ActionResult, PageKind } from '@mi/db/domain';
import { restoreRevision } from '@/app/actions/pages';

function RestoreSubmit() {
  const { pending } = useFormStatus();
  return (
    <ConfirmButton
      type="submit"
      variant="secondary"
      size="sm"
      confirmText="Restore this revision? This creates a new revision with the old body."
      disabled={pending}
    >
      {pending ? 'Restoring…' : 'Restore this revision'}
    </ConfirmButton>
  );
}

export function RestoreForm({ slug, kind, revision }: { slug: string; kind: PageKind; revision: number }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => restoreRevision(slug, kind, revision),
    null,
  );
  return (
    <form action={formAction}>
      <RestoreSubmit />
      <FormErrors state={state} />
    </form>
  );
}
