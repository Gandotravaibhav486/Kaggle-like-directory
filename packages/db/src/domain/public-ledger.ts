import type { LedgerFigures } from './ledger';
import { fromMinor } from './ledger';
import type { RankInput } from './ranking';

export interface PublicLedgerMonth {
  month: string; // 'YYYY-MM'
  revenueMinor: number;
  payingCustomers: number;
}

export interface LedgerMonthRow extends LedgerFigures {
  id: string;
  month: string; // 'YYYY-MM-01'
  sharedPublicly: boolean;
  note: string;
}

/**
 * THE ONLY public projection of ledger data. Keeps shared months only and exposes
 * exactly month, revenueMinor and payingCustomers (built as a new object, never spread).
 */
export function toPublicLedger(
  rows: ReadonlyArray<Pick<LedgerMonthRow, 'month' | 'revenueMinor' | 'payingCustomers' | 'sharedPublicly'>>,
): PublicLedgerMonth[] {
  const out: PublicLedgerMonth[] = [];
  for (const r of rows) {
    if (r.sharedPublicly !== true) continue;
    out.push({
      month: String(r.month).slice(0, 7),
      revenueMinor: Number(r.revenueMinor),
      payingCustomers: Number(r.payingCustomers),
    });
  }
  out.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  return out;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM' -> 'Sep 2026' (fixed English short names; independent of ICU data). */
export function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-');
  return `${MONTHS_SHORT[Number(m) - 1] ?? m} ${y}`;
}

/** 'YYYY-MM' -> last calendar day 'YYYY-MM-DD'. */
export function lastDayOfMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${yyyyMm}-${String(d).padStart(2, '0')}`;
}

export type PublicRevenueEntry = RankInput & {
  label: string;
  example: false;
  evidenceUrl: null;
  payingCustomers: number;
};

export function publicRevenueBoardEntries(
  pub: readonly PublicLedgerMonth[],
  _currency: string,
): PublicRevenueEntry[] {
  return pub.map((p) => ({
    id: `ledger-${p.month}`,
    label: monthLabel(p.month),
    value: fromMinor(p.revenueMinor),
    entryDate: lastDayOfMonth(p.month),
    sourceNote: 'Owner ledger (month shared publicly)',
    example: false as const,
    evidenceUrl: null,
    payingCustomers: p.payingCustomers,
  }));
}
