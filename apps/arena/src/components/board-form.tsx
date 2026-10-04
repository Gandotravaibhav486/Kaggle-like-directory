'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Select } from '@mi/ui';
import { FormErrors, SubmitButton } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import type { Board } from '@mi/db/schema';
import { createBoardAction, updateBoardAction } from '@/app/actions/boards';

function BoardFields({ board, fieldErrors }: { board?: Board; fieldErrors?: Record<string, string[]> }) {
  return (
    <>
      <Field label="Title" name="title" required error={fieldErrors?.title}>
        <Input defaultValue={board?.title} />
      </Field>
      <Field label="Objective" name="objective" required error={fieldErrors?.objective}>
        <Input defaultValue={board?.objective} />
      </Field>
      <Field label="Unit" name="unit" required error={fieldErrors?.unit} hint="e.g. pts SD, candidates started">
        <Input defaultValue={board?.unit} />
      </Field>
      <Field label="Direction" name="direction" required error={fieldErrors?.direction}>
        <Select defaultValue={board?.direction ?? 'higher'}>
          <option value="higher">Higher is better</option>
          <option value="lower">Lower is better</option>
        </Select>
      </Field>
      <Field label="Target" name="target" hint="Optional" error={fieldErrors?.target}>
        <Input defaultValue={board?.target ?? ''} inputMode="decimal" />
      </Field>
      <Field label="Period" name="period" required error={fieldErrors?.period} hint="e.g. season to date">
        <Input defaultValue={board?.period} />
      </Field>
      <Field label="Slug" name="slug" required error={fieldErrors?.slug} hint="Lowercase letters, numbers and hyphens">
        <Input defaultValue={board?.slug} />
      </Field>
      <Field label="Decimals" name="decimals" error={fieldErrors?.decimals}>
        <Input defaultValue={board?.decimals ?? 2} inputMode="numeric" />
      </Field>
    </>
  );
}

export function CreateBoardForm({ slug }: { slug: string }) {
  const router = useRouter();
  const action = createBoardAction.bind(null, slug);
  const [state, formAction] = useActionState<ActionResult<{ boardSlug: string }> | null, FormData>(action, null);

  useEffect(() => {
    if (state?.ok) router.push(`/competitions/${slug}/leaderboard/${state.data.boardSlug}`);
  }, [state, router, slug]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate className="space-y-4">
      <BoardFields fieldErrors={fieldErrors} />
      <SubmitButton>Create board</SubmitButton>
      <FormErrors state={state} />
    </form>
  );
}

export function UpdateBoardForm({ slug, board }: { slug: string; board: Board }) {
  const action = updateBoardAction.bind(null, slug, board.id);
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate className="space-y-4">
      <BoardFields board={board} fieldErrors={fieldErrors} />
      <SubmitButton>Save board</SubmitButton>
      {state?.ok && <span className="ml-2 text-small text-positive">{state.message ?? 'Saved'}</span>}
      <FormErrors state={state} />
    </form>
  );
}
