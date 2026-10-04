'use client';

import { useActionState } from 'react';
import { Field, Input } from '@mi/ui';
import { SubmitButton, FormErrors } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';

export function SignInForm({
  action,
}: {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrors state={state} />
      <Field label="Email" name="email" error={fieldErrors?.email}>
        <Input type="email" placeholder="you@example.com" />
      </Field>
      <SubmitButton pendingLabel="Sending…">Send magic link</SubmitButton>
    </form>
  );
}
