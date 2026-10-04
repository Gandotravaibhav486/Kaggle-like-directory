'use client';

import { useActionState, useState } from 'react';
import { MarkdownEditor, FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult, PageKind } from '@mi/db/domain';
import { savePage } from '@/app/actions/pages';

export function PageEditForm({
  slug,
  kind,
  initialValue,
}: {
  slug: string;
  kind: PageKind;
  initialValue: string;
}) {
  const action = savePage.bind(null, slug, kind);
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(action, null);
  const [dirty, setDirty] = useState(false);

  return (
    <form action={formAction}>
      <MarkdownEditor name="bodyMd" initialValue={initialValue} label={`Edit ${kind}`} onDirtyChange={setDirty} />
      <div className="mt-4 flex items-center gap-3">
        <SubmitButton>Save</SubmitButton>
        {state?.ok && <span className="text-small text-positive">{state.message ?? 'Saved'}</span>}
        {dirty && !state?.ok && <span className="text-small text-fg-muted">Unsaved changes</span>}
      </div>
      <FormErrors state={state} />
    </form>
  );
}
