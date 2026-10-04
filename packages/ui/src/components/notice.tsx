import type { ReactNode } from 'react';
import { cn } from '../format';

export type NoticeTone = 'info' | 'neutral' | 'warning' | 'danger' | 'success';

const toneClasses: Record<NoticeTone, string> = {
  info: 'border-accent/30 bg-accent-subtle text-fg',
  neutral: 'border-border bg-surface-sunken text-fg',
  warning: 'border-warning/40 bg-warning-subtle text-fg',
  danger: 'border-negative/40 bg-negative-subtle text-fg',
  success: 'border-positive/40 bg-positive-subtle text-fg',
};

export interface NoticeProps {
  tone: NoticeTone;
  title?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

export function Notice({ tone, title, children, 'data-testid': testId }: NoticeProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      data-testid={testId}
      className={cn('rounded-md border p-3 text-small', toneClasses[tone])}
    >
      {title && <p className="font-semibold text-fg">{title}</p>}
      {children && <div className={title ? 'mt-1 text-fg-secondary' : 'text-fg-secondary'}>{children}</div>}
    </div>
  );
}
