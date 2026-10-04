'use client';
import type { ActionResult } from '../types';

export interface FormErrorsProps {
  state: ActionResult<unknown> | null;
}

export function FormErrors({ state }: FormErrorsProps) {
  if (!state || state.ok || !state.formError) return null;
  return (
    <p
      role="alert"
      data-testid="form-error"
      className="rounded-md border border-negative/40 bg-negative-subtle p-3 text-small text-fg"
    >
      {state.formError}
    </p>
  );
}
