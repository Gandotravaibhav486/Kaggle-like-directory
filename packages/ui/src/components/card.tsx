import type { ReactNode } from 'react';
import { cn } from '../format';

export interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4 shadow-card dark:shadow-none md:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          {title && <h2 className="text-h2 font-semibold text-fg">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
