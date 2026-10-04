'use client';

import { useActionState, useOptimistic, useTransition } from 'react';
import { ConfirmButton, Switch, FormErrors } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { deleteLedgerMonthAction, setLedgerShared } from '@/app/actions/ledger';

export function LedgerShareToggle({ slug, id, sharedPublicly }: { slug: string; id: string; sharedPublicly: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(sharedPublicly);
  const [, startTransition] = useTransition();

  function onChange(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      await setLedgerShared(slug, id, next);
    });
  }

  return (
    <Switch
      checked={optimistic}
      onChange={onChange}
      label="Share this month publicly"
      data-testid="ledger-share-toggle"
    />
  );
}

export function DeleteLedgerMonthButton({ slug, id }: { slug: string; id: string }) {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => deleteLedgerMonthAction(slug, id),
    null,
  );
  return (
    <form action={formAction} className="inline">
      <ConfirmButton type="submit" variant="ghost" size="sm" confirmText="Delete this month?">
        Delete
      </ConfirmButton>
      <FormErrors state={state} />
    </form>
  );
}
