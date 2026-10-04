import { forwardRef, type InputHTMLAttributes, type ReactElement, type SelectHTMLAttributes, type TextareaHTMLAttributes, cloneElement, isValidElement } from 'react';
import { cn } from '../format';

const inputBase =
  'block w-full min-h-11 rounded-md border border-border-strong bg-surface px-3 text-body text-fg placeholder:text-fg-muted hover:border-fg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus focus-visible:border-focus';

const invalidClasses = 'border-negative bg-negative-subtle/40 focus-visible:outline-negative';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(inputBase, ariaInvalid ? invalidClasses : undefined, className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={ariaInvalid}
      className={cn(inputBase, 'min-h-32 py-2.5 leading-6', ariaInvalid ? invalidClasses : undefined, className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, 'aria-invalid': ariaInvalid, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={ariaInvalid}
        className={cn(inputBase, 'appearance-none pr-9', ariaInvalid ? invalidClasses : undefined, className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
      >
        <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export interface FieldProps {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
  required?: boolean;
  children: ReactElement<{ id?: string; name?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; required?: boolean }>;
}

export function Field({ label, name, hint, error, required, children }: FieldProps) {
  const hasError = Boolean(error && error.length > 0);
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = hasError ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: name,
        name,
        'aria-invalid': hasError,
        'aria-describedby': describedBy,
        required,
      })
    : children;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-small font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden="true" className="text-negative">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="mt-1.5 text-small text-fg-muted">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} data-testid={`field-error-${name}`} className="mt-1.5 flex items-start gap-1.5 text-small text-negative">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M8 4.5v4M8 11v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error!.join(', ')}</span>
        </p>
      )}
    </div>
  );
}
