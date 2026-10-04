'use client';

import { useActionState } from 'react';
import { Field, Input } from '@mi/ui';
import { FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { addEntryAction, updateEntryAction } from '@/app/actions/boards';

export interface EditableEntry {
  id: string;
  label: string;
  value: number;
  entryDate: string | null;
  sourceNote: string | null;
  evidenceUrl: string | null;
}

function EntryFields({ entry, fieldErrors }: { entry?: EditableEntry; fieldErrors?: Record<string, string[]> }) {
  return (
    <>
      <Field label="Label" name="label" required error={fieldErrors?.label}>
        <Input defaultValue={entry?.label} />
      </Field>
      <Field label="Value" name="value" required error={fieldErrors?.value}>
        <Input defaultValue={entry?.value} inputMode="decimal" />
      </Field>
      <Field label="Date" name="entryDate" required error={fieldErrors?.entryDate}>
        <Input type="date" defaultValue={entry?.entryDate ?? ''} />
      </Field>
      <Field label="Source note" name="sourceNote" required error={fieldErrors?.sourceNote}>
        <Input defaultValue={entry?.sourceNote ?? ''} />
      </Field>
      <Field label="Evidence link" name="evidenceUrl" hint="Optional" error={fieldErrors?.evidenceUrl}>
        <Input defaultValue={entry?.evidenceUrl ?? ''} />
      </Field>
    </>
  );
}

export function AddEntryForm({ slug, boardSlug, boardId }: { slug: string; boardSlug: string; boardId: string }) {
  const action = addEntryAction.bind(null, slug, boardSlug, boardId);
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate className="space-y-4">
      <EntryFields fieldErrors={fieldErrors} />
      <SubmitButton>Add entry</SubmitButton>
      {state?.ok && <span className="ml-2 text-small text-positive">Added</span>}
      <FormErrors state={state} />
    </form>
  );
}

export function EditEntryForm({
  slug,
  boardSlug,
  entry,
}: {
  slug: string;
  boardSlug: string;
  entry: EditableEntry;
}) {
  const action = updateEntryAction.bind(null, slug, boardSlug, entry.id);
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate className="space-y-4">
      <EntryFields entry={entry} fieldErrors={fieldErrors} />
      <SubmitButton>Save</SubmitButton>
      {state?.ok && <span className="ml-2 text-small text-positive">Saved</span>}
      <FormErrors state={state} />
    </form>
  );
}
