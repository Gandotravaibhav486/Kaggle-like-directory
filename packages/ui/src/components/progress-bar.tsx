export interface ProgressBarProps {
  value: number | null;
  label: string;
  valueText?: string;
}

/** Progress of best entry against target. value is a 0..1 ratio, or null = no target. */
export function ProgressBar({ value, label, valueText }: ProgressBarProps) {
  if (value === null) {
    return <p className="text-small text-fg-muted">No target set</p>;
  }
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const met = value >= 1;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-surface-sunken ring-1 ring-inset ring-border">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={valueText ?? `${pct}% of the way to target`}
          aria-label={label}
          data-testid="progress-bar"
          className={met ? 'h-full rounded-sm bg-positive motion-safe:transition-[width] motion-safe:duration-200' : 'h-full rounded-sm bg-accent motion-safe:transition-[width] motion-safe:duration-200'}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="num whitespace-nowrap text-small tnum text-fg-secondary">
        {met ? 'Target met' : `${pct}% of target`}
      </span>
    </div>
  );
}
