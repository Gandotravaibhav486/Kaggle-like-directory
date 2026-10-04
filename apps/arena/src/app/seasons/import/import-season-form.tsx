'use client';

import { useActionState, useRef } from 'react';
import { Field, Input, Textarea } from '@mi/ui';
import { FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { importSeasonAction } from '@/app/actions/seasons';

export function ImportSeasonForm() {
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(importSeasonAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (textareaRef.current && typeof reader.result === 'string') {
        textareaRef.current.value = reader.result;
      }
    };
    reader.readAsText(file);
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field label="Season JSON file" name="file" hint="Or paste the JSON below">
        <Input type="file" accept="application/json" onChange={onFile} />
      </Field>
      <Field label="Season JSON" name="json" error={fieldErrors?.json ?? fieldErrors?._form}>
        <Textarea ref={textareaRef} rows={12} />
      </Field>
      <Field label="New slug" name="newSlug" required error={fieldErrors?.newSlug}>
        <Input />
      </Field>
      <Field label="New title" name="newTitle" hint="Optional, defaults to the exported title" error={fieldErrors?.newTitle}>
        <Input />
      </Field>
      <SubmitButton>Import season</SubmitButton>
      <FormErrors state={state} />
    </form>
  );
}
