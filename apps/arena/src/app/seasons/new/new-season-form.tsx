'use client';

import { useActionState } from 'react';
import { Field, Input } from '@mi/ui';
import { FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { createSeasonAction } from '@/app/actions/seasons';

export function NewSeasonForm() {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(createSeasonAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field label="Slug" name="slug" required error={fieldErrors?.slug} hint="Lowercase letters, numbers and hyphens">
        <Input placeholder="mock-interview-v6" />
      </Field>
      <Field label="Title" name="title" required error={fieldErrors?.title}>
        <Input placeholder="MockInterview V6" />
      </Field>
      <Field label="Tagline" name="tagline" error={fieldErrors?.tagline}>
        <Input />
      </Field>
      <Field label="Starts on" name="startsOn" error={fieldErrors?.startsOn}>
        <Input type="date" />
      </Field>
      <Field label="Ends on" name="endsOn" error={fieldErrors?.endsOn}>
        <Input type="date" />
      </Field>
      <Field label="Currency" name="currency" error={fieldErrors?.currency} hint="3-letter code, default INR">
        <Input placeholder="INR" />
      </Field>
      <SubmitButton>Create season</SubmitButton>
      <FormErrors state={state} />
    </form>
  );
}
