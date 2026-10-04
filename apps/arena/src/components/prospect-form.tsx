'use client';

import { startTransition, useActionState, useRef, useState, type FormEvent } from 'react';
import { Field, Input, Textarea } from '@mi/ui';
import { FormErrors, Switch, SubmitButton } from '@mi/ui/client';
import { fromMinor, PIPELINE_STAGES, type ActionResult, type ProspectRow } from '@mi/db/domain';
import { saveProspect } from '@/app/actions/pipeline';

const STAGE_LABELS: Record<(typeof PIPELINE_STAGES)[number]['field'], string> = {
  emailedOn: 'Outreach emailed',
  repliedOn: 'Replied',
  demoOn: 'Demo',
  secondCallOn: '2nd call',
  wonOn: 'Contract signed',
};

export function ProspectForm({ slug, prospect }: { slug: string; prospect?: ProspectRow }) {
  const save = saveProspect.bind(null, slug, prospect?.id ?? null);
  const formRef = useRef<HTMLFormElement>(null);
  const [example, setExample] = useState(prospect?.example ?? false);
  const [state, formAction, pending] = useActionState<ActionResult<undefined> | null, FormData>(async (prev, data) => {
    const result = await save(prev, data);
    if (result.ok && !prospect) {
      formRef.current?.reset();
      setExample(false);
    }
    return result;
  }, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  // Submitting via onSubmit (not the form `action` prop) stops React resetting the fields when
  // validation fails; the add form is cleared above once a prospect is saved.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" name="company" required error={fieldErrors?.company}>
          <Input defaultValue={prospect?.company ?? ''} />
        </Field>
        <Field label="Channel" name="channel" hint="e.g. Cold email, LinkedIn, referral" error={fieldErrors?.channel}>
          <Input defaultValue={prospect?.channel ?? ''} />
        </Field>
        <Field label="Contact name" name="contactName" error={fieldErrors?.contactName}>
          <Input defaultValue={prospect?.contactName ?? ''} />
        </Field>
        <Field label="Contact email" name="contactEmail" error={fieldErrors?.contactEmail}>
          <Input type="email" defaultValue={prospect?.contactEmail ?? ''} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-fg">Stage dates</legend>
        <p className="mb-3 text-small text-fg-muted">Fill a date when the prospect reaches that stage. Leave later stages blank.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PIPELINE_STAGES.map((s) => (
            <Field
              key={s.field}
              label={STAGE_LABELS[s.field]}
              name={s.field}
              required={s.field === 'emailedOn'}
              error={fieldErrors?.[s.field]}
            >
              <Input type="date" defaultValue={prospect?.[s.field] ?? ''} />
            </Field>
          ))}
          <Field label="Lost" name="lostOn" error={fieldErrors?.lostOn}>
            <Input type="date" defaultValue={prospect?.lostOn ?? ''} />
          </Field>
        </div>
      </fieldset>

      <Field
        label="Contract value"
        name="contractValue"
        hint="Only once a contract is signed"
        error={fieldErrors?.contractValue}
      >
        <Input
          inputMode="decimal"
          defaultValue={prospect?.contractValueMinor != null ? fromMinor(prospect.contractValueMinor).toFixed(2) : ''}
        />
      </Field>
      <Field label="Note" name="note" error={fieldErrors?.note}>
        <Textarea defaultValue={prospect?.note ?? ''} />
      </Field>
      <Switch name="example" label="Example (placeholder, not a real prospect)" checked={example} onChange={setExample} />
      <SubmitButton disabled={pending} aria-busy={pending}>
        {pending ? 'Saving…' : 'Save prospect'}
      </SubmitButton>
      {state?.ok && <span className="ml-2 text-small text-positive">Saved</span>}
      <FormErrors state={state} />
    </form>
  );
}
