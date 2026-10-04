'use client';

import { useActionState, useState } from 'react';
import { Field, Input, Textarea } from '@mi/ui';
import { FormErrors, Switch, SubmitButton } from '@mi/ui/client';
import { fromMinor, type ActionResult, type LedgerMonthRow } from '@mi/db/domain';
import { saveLedgerMonth } from '@/app/actions/ledger';

function money(minor?: number): string {
  return minor === undefined ? '' : fromMinor(minor).toFixed(2);
}

export function LedgerForm({ slug, month }: { slug: string; month?: LedgerMonthRow }) {
  const action = saveLedgerMonth.bind(null, slug, month?.id ?? null);
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const [shared, setShared] = useState(month?.sharedPublicly ?? false);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field label="Month" name="month" required error={fieldErrors?.month} hint="e.g. 2026-09">
        <Input type="month" defaultValue={month?.month.slice(0, 7) ?? ''} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Revenue" name="revenue" error={fieldErrors?.revenue}>
          <Input defaultValue={money(month?.revenueMinor)} inputMode="decimal" />
        </Field>
        <Field label="Paying customers" name="payingCustomers" error={fieldErrors?.payingCustomers}>
          <Input defaultValue={month?.payingCustomers ?? ''} inputMode="numeric" />
        </Field>
        <Field label="Invoices raised" name="invoicesRaised" error={fieldErrors?.invoicesRaised}>
          <Input defaultValue={month?.invoicesRaised ?? ''} inputMode="numeric" />
        </Field>
        <Field label="Invoices paid" name="invoicesPaid" error={fieldErrors?.invoicesPaid}>
          <Input defaultValue={month?.invoicesPaid ?? ''} inputMode="numeric" />
        </Field>
        <Field label="Hosting" name="hosting" error={fieldErrors?.hosting}>
          <Input defaultValue={money(month?.hostingMinor)} inputMode="decimal" />
        </Field>
        <Field label="Speech services" name="speech" error={fieldErrors?.speech}>
          <Input defaultValue={money(month?.speechMinor)} inputMode="decimal" />
        </Field>
        <Field label="AI model usage" name="aiUsage" error={fieldErrors?.aiUsage}>
          <Input defaultValue={money(month?.aiUsageMinor)} inputMode="decimal" />
        </Field>
        <Field label="Other expenses" name="other" error={fieldErrors?.other}>
          <Input defaultValue={money(month?.otherMinor)} inputMode="decimal" />
        </Field>
      </div>
      <Field label="Note" name="note" error={fieldErrors?.note}>
        <Textarea defaultValue={month?.note ?? ''} />
      </Field>
      <Switch
        name="sharedPublicly"
        label="Share this month publicly"
        checked={shared}
        onChange={setShared}
        data-testid="ledger-share-toggle-form"
      />
      <SubmitButton>Save month</SubmitButton>
      {state?.ok && <span className="ml-2 text-small text-positive">Saved</span>}
      <FormErrors state={state} />
    </form>
  );
}
