'use client';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '../components/button';

export interface SubmitButtonProps extends ButtonProps {
  pendingLabel?: string;
}

export function SubmitButton({ pendingLabel = 'Saving…', children, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-busy={pending} disabled={pending || disabled} {...props}>
      {pending && (
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 motion-safe:animate-spin">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
          <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )}
      {pending ? pendingLabel : children}
    </Button>
  );
}
