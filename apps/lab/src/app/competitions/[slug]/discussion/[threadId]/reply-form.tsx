'use client';

import { useActionState, useRef, useEffect } from 'react';
import { Card, Field, Input, Textarea } from '@mi/ui';
import { SubmitButton, FormErrors } from '@mi/ui/client';
import { createReply } from '@/app/actions/discussion';

export function ReplyForm({ threadId }: { threadId: string }) {
  const action = createReply.bind(null, threadId);
  const [state, formAction] = useActionState(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card title="Post a reply">
      <form ref={formRef} action={formAction} noValidate className="space-y-4">
        <FormErrors state={state} />
        <Field label="Your name" name="authorName" required error={fieldErrors?.authorName}>
          <Input required maxLength={60} />
        </Field>
        <Field label="Reply" name="bodyMd" required error={fieldErrors?.bodyMd} hint="Markdown is supported.">
          <Textarea required rows={4} />
        </Field>
        <div className="hidden" aria-hidden="true">
          <label htmlFor={`website-${threadId}`}>Leave this field empty</label>
          <input id={`website-${threadId}`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <SubmitButton>Post reply</SubmitButton>
      </form>
    </Card>
  );
}
