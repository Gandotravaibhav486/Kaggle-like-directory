import { useId, type ReactNode } from 'react';

export interface ScrollTableProps {
  caption: string;
  captionVisible?: boolean;
  children: ReactNode;
  minWidthClassName?: string;
  /** Optional passthrough so callers can satisfy the mandatory data-testids in
   * ARCHITECTURE.md §8.5 (e.g. "leaderboard-table", "ledger-table") on the <table> itself. */
  'data-testid'?: string;
}

/** Focusable overflow container, sticky header via the `thead th` classes applied by callers. */
export function ScrollTable({
  caption,
  captionVisible,
  children,
  minWidthClassName = 'min-w-[640px]',
  'data-testid': testId,
}: ScrollTableProps) {
  const captionId = useId();
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      data-testid="scroll-table-region"
      className="relative overflow-x-auto rounded-lg border border-border bg-surface"
    >
      {captionVisible && (
        <p id={captionId} className="px-3 pt-2.5 text-h3 font-semibold text-fg">
          {caption}
        </p>
      )}
      <table data-testid={testId} className={`w-full border-collapse text-small ${minWidthClassName}`}>
        {!captionVisible && <caption id={captionId} className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
