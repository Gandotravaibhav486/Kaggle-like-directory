// Formatting helpers shared across @mi/ui components and the apps.
// Exported at @mi/ui/format.

/** Join class names, filtering out falsy values. No dependency on clsx's full API. */
export function cn(...classes: Array<string | false | null | undefined | 0>): string {
  return classes.filter(Boolean).join(' ');
}

/** 123450 (minor units) + 'INR' -> '₹1,234.50' using en-IN grouping. */
export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/** Tabular-friendly plain number formatting, en-IN grouping. */
export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** ratio 0.1234 -> '12.3%'. null -> em dash. */
export function formatPercent(ratio: number | null, decimals = 1): string {
  if (ratio === null || Number.isNaN(ratio) || !Number.isFinite(ratio)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio);
}

/** '2026-10-04' or Date -> '4 Oct 2026'. */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** '2026-10' -> 'Oct 2026'. */
export function formatMonth(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}
