import { cn, formatMoney, formatNumber, formatPercent } from '../format';

export interface NumProps {
  value: number | null;
  decimals?: number;
  unit?: string;
  signed?: boolean;
  className?: string;
}

/** Tabular mono number. Renders an em dash for null. */
export function Num({ value, decimals = 0, unit, signed, className }: NumProps) {
  if (value === null || Number.isNaN(value)) {
    return <span className={cn('num tnum text-fg-muted', className)}>{'—'}</span>;
  }
  const sign = signed && value > 0 ? '+' : '';
  const text = value < 0 ? `−${formatNumber(Math.abs(value), decimals)}` : `${sign}${formatNumber(value, decimals)}`;
  return (
    <span className={cn('num tnum', className)}>
      {text}
      {unit ? ` ${unit}` : ''}
    </span>
  );
}

export interface MoneyProps {
  minor: number | null;
  currency: string;
  className?: string;
}

export function Money({ minor, currency, className }: MoneyProps) {
  if (minor === null || Number.isNaN(minor)) {
    return <span className={cn('num tnum text-fg-muted', className)}>{'—'}</span>;
  }
  const text = minor < 0 ? `−${formatMoney(Math.abs(minor), currency)}` : formatMoney(minor, currency);
  return <span className={cn('num tnum', className)}>{text}</span>;
}

export interface PercentProps {
  ratio: number | null;
  decimals?: number;
  className?: string;
}

export function Percent({ ratio, decimals = 1, className }: PercentProps) {
  if (ratio === null || Number.isNaN(ratio)) {
    return <span className={cn('num tnum text-fg-muted', className)}>{'—'}</span>;
  }
  const text = ratio < 0 ? `−${formatPercent(Math.abs(ratio), decimals)}` : formatPercent(ratio, decimals);
  return <span className={cn('num tnum', className)}>{text}</span>;
}
