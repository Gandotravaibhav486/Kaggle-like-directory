import { LinkButton } from './button';

export interface OwnerOnlyProps {
  title?: string;
  signInHref: string;
}

export function OwnerOnly({ title = 'This area is owner only', signInHref }: OwnerOnlyProps) {
  return (
    <div data-testid="owner-only-notice" className="rounded-lg border border-dashed border-border-strong/60 bg-surface px-6 py-10 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto size-6 text-fg-muted">
        <rect x="5" y="10.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <p className="mt-3 text-h3 font-semibold text-fg">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-small text-fg-secondary">
        Only the owner can view or edit this. Sign in with the owner email to continue.
      </p>
      <div className="mt-4">
        <LinkButton href={signInHref} variant="secondary">
          Sign in
        </LinkButton>
      </div>
    </div>
  );
}
