'use client';

import { useActionState } from 'react';
import { Field, Input } from '@mi/ui';
import { SubmitButton } from '@mi/ui/client';
import { requestMagicLink } from '@/app/actions/auth';

export function SignInForm() {
  const [, formAction] = useActionState(requestMagicLink, { ok: false });
  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field label="Email address" name="email" required>
        <Input type="email" autoComplete="email" placeholder="you@example.com" />
      </Field>
      <SubmitButton pendingLabel="Sending…" className="w-full">
        Send magic link
      </SubmitButton>
    </form>
  );
}
