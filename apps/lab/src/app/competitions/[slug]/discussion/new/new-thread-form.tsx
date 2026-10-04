'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Select, Textarea } from '@mi/ui';
import { SubmitButton, FormErrors } from '@mi/ui/client';
import { THREAD_TAGS, type ActionResult } from '@mi/db/domain';

export function NewThreadForm({
  action,
  slug,
}: {
  action: (prev: ActionResult<{ threadId: string }> | null, fd: FormData) => Promise<ActionResult<{ threadId: string }>>;
  slug: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) router.push(`/competitions/${slug}/discussion/${state.data.threadId}`);
  }, [state, router, slug]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrors state={state} />
      <Field label="Title" name="title" required error={fieldErrors?.title} hint="At least 5 characters.">
        <Input required minLength={5} maxLength={140} />
      </Field>
      <Field label="Tag" name="tag" required error={fieldErrors?.tag}>
        <Select required defaultValue={THREAD_TAGS[0]}>
          {THREAD_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Your name" name="authorName" required error={fieldErrors?.authorName}>
        <Input required maxLength={60} />
      </Field>
      <Field label="Post" name="bodyMd" required error={fieldErrors?.bodyMd} hint="Markdown is supported.">
        <Textarea required rows={8} />
      </Field>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton>Post topic</SubmitButton>
    </form>
  );
}
