'use client';
import { useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  label: string;
  name?: string;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  'data-testid'?: string;
}

export function Switch({ checked, label, name, onChange, disabled, 'data-testid': testId }: SwitchProps) {
  const labelId = useId();

  return (
    <label className="group flex min-h-11 cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        data-testid={testId}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border-strong bg-surface-sunken transition-colors duration-150 aria-checked:border-accent aria-checked:bg-accent disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={
            checked
              ? 'size-4 translate-x-6 rounded-full bg-accent-fg transition-transform duration-200'
              : 'size-4 translate-x-1 rounded-full bg-fg-muted transition-transform duration-200'
          }
        />
      </button>
      {name && <input type="hidden" name={name} value={checked ? 'true' : 'false'} />}
      <span id={labelId} className={checked ? 'text-small text-positive' : 'text-small text-fg-muted'}>
        {checked ? 'Public' : 'Private'}
        <span className="sr-only"> — {label}</span>
      </span>
    </label>
  );
}
