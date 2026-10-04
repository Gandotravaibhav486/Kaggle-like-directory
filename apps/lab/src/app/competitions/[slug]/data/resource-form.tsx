'use client';

import { useActionState, useState } from 'react';
import { Button, Field, Input, Select, Textarea } from '@mi/ui';
import { SubmitButton, FormErrors } from '@mi/ui/client';
import { RESOURCE_KINDS } from '@mi/db/domain';
import { saveResource } from '@/app/actions/resources';

export interface ResourceFormValues {
  id: string;
  name: string;
  kind: string;
  url: string | null;
  usedFor: string;
  notes: string;
}

export function ResourceFormDialog({ slug, initial }: { slug: string; initial?: ResourceFormValues }) {
  const [open, setOpen] = useState(false);
  const action = saveResource.bind(null, slug, initial?.id ?? null);
  const [state, formAction] = useActionState(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  if (!open) {
    return (
      <Button variant={initial ? 'secondary' : 'primary'} size={initial ? 'sm' : 'md'} onClick={() => setOpen(true)}>
        {initial ? 'Edit' : 'Add resource'}
      </Button>
    );
  }

  return (
    <div className="mt-4 w-full rounded-lg border border-border bg-surface p-4">
      <form action={formAction} noValidate className="space-y-4">
        <FormErrors state={state} />
        <Field label="Name" name="name" required error={fieldErrors?.name}>
          <Input required defaultValue={initial?.name} />
        </Field>
        <Field label="Kind" name="kind" required error={fieldErrors?.kind}>
          <Select required defaultValue={initial?.kind ?? RESOURCE_KINDS[0]}>
            {RESOURCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Link" name="url" error={fieldErrors?.url} hint="Optional http(s) URL.">
          <Input type="url" defaultValue={initial?.url ?? ''} />
        </Field>
        <Field label="Used for" name="usedFor" required error={fieldErrors?.usedFor}>
          <Textarea required rows={2} defaultValue={initial?.usedFor} />
        </Field>
        <Field label="Notes (limits, licence, cost)" name="notes" error={fieldErrors?.notes}>
          <Textarea rows={2} defaultValue={initial?.notes} />
        </Field>
        <div className="flex gap-2">
          <SubmitButton>Save</SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
