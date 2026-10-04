import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong/60 bg-surface px-6 py-10 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto size-6 text-fg-muted">
        <rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="mt-3 text-h3 font-semibold text-fg">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-small text-fg-secondary">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
