'use client';

import { useActionState } from 'react';
import { ConfirmButton, FormErrors } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { removeAllExamplesAction } from '@/app/actions/boards';

export function RemoveExamplesButton({ slug }: { slug: string }) {
  const [state, formAction] = useActionState<ActionResult<{ removed: number }> | null, FormData>(
    async () => removeAllExamplesAction(slug),
    null,
  );
  return (
    <form action={formAction}>
      <ConfirmButton
        type="submit"
        variant="danger-quiet"
        size="sm"
        confirmText="Remove every example row from every board in this season?"
      >
        Remove all examples
      </ConfirmButton>
      {state?.ok && (
        <span className="ml-2 text-small text-fg-muted">Removed {state.data.removed}</span>
      )}
      <FormErrors state={state} />
    </form>
  );
}
