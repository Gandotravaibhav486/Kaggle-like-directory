'use client';

import { useActionState } from 'react';
import { ConfirmButton, FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { deleteProspectAction, moveProspect } from '@/app/actions/pipeline';

/** "Mark replied" / "Mark demo" etc. Dated today; edit the prospect to back-date it. */
export function AdvanceProspectButton({ slug, id, nextLabel }: { slug: string; id: string; nextLabel: string }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => moveProspect(slug, id, 'next'),
    null,
  );
  return (
    <form action={formAction} className="inline">
      <SubmitButton variant="secondary" size="sm" data-testid="prospect-advance">
        {`→ ${nextLabel}`}
      </SubmitButton>
      <FormErrors state={state} />
    </form>
  );
}

export function MarkProspectLostButton({ slug, id }: { slug: string; id: string }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => moveProspect(slug, id, 'lost'),
    null,
  );
  return (
    <form action={formAction} className="inline">
      <ConfirmButton type="submit" variant="ghost" size="sm" confirmText="Mark as lost?">
        Lost
      </ConfirmButton>
      <FormErrors state={state} />
    </form>
  );
}

export function DeleteProspectButton({ slug, id }: { slug: string; id: string }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => deleteProspectAction(slug, id),
    null,
  );
  return (
    <form action={formAction} className="inline">
      <ConfirmButton type="submit" variant="ghost" size="sm" confirmText="Delete this prospect?">
        Delete
      </ConfirmButton>
      <FormErrors state={state} />
    </form>
  );
}
