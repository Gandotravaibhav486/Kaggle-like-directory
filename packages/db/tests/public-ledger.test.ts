import { describe, expect, it } from 'vitest';
import { publicRevenueBoardEntries, toPublicLedger, type LedgerMonthRow } from '../src/domain/public-ledger';
import { rankEntries } from '../src/domain/ranking';

const row = (month: string, sharedPublicly: boolean, over: Partial<LedgerMonthRow> = {}): LedgerMonthRow => ({
  id: `id-${month}`,
  month,
  revenueMinor: 500_000,
  payingCustomers: 12,
  invoicesRaised: 10,
  invoicesPaid: 9,
  hostingMinor: 11_111,
  speechMinor: 22_222,
  aiUsageMinor: 33_333,
  otherMinor: 44_444,
  note: 'private note',
  sharedPublicly,
  ...over,
});

const EXPENSE_VALUES = [11_111, 22_222, 33_333, 44_444];

describe('toPublicLedger', () => {
  it('keeps only months shared publicly', () => {
    const pub = toPublicLedger([row('2026-07-01', false), row('2026-08-01', true), row('2026-09-01', false)]);
    expect(pub.map((p) => p.month)).toEqual(['2026-08']);
  });

  it('returns an empty list when nothing is shared', () => {
    expect(toPublicLedger([row('2026-07-01', false)])).toEqual([]);
    expect(toPublicLedger([])).toEqual([]);
  });

  it('exposes exactly month, revenueMinor and payingCustomers', () => {
    const [p] = toPublicLedger([row('2026-08-01', true)]);
    expect(Object.keys(p!).sort()).toEqual(['month', 'payingCustomers', 'revenueMinor']);
    expect(p).toEqual({ month: '2026-08', revenueMinor: 500_000, payingCustomers: 12 });
  });

  it('never leaks expense, invoice, note or id values, even via extra input properties', () => {
    const tainted = {
      ...row('2026-08-01', true),
      secret: 'do-not-leak',
      totalExpensesMinor: 111_110,
    } as LedgerMonthRow & Record<string, unknown>;
    const pub = toPublicLedger([tainted]);
    const json = JSON.stringify(pub);
    for (const v of EXPENSE_VALUES) expect(json).not.toContain(String(v));
    expect(json).not.toContain('do-not-leak');
    expect(json).not.toContain('private note');
    expect(json).not.toContain('111110');
    expect(json).not.toContain('id-2026');
    expect(json).not.toMatch(/hosting|speech|aiUsage|other|invoices|note|sharedPublicly|expense/i);
  });

  it('requires sharedPublicly === true exactly (truthy values are not enough)', () => {
    const weird = { ...row('2026-08-01', false), sharedPublicly: 'true' as unknown as boolean };
    expect(toPublicLedger([weird])).toEqual([]);
  });

  it('sorts by month ascending regardless of input order', () => {
    const pub = toPublicLedger([row('2026-09-01', true), row('2025-12-01', true), row('2026-01-01', true)]);
    expect(pub.map((p) => p.month)).toEqual(['2025-12', '2026-01', '2026-09']);
  });
});

describe('publicRevenueBoardEntries', () => {
  it('maps public months to rankable, non-example revenue entries', () => {
    const entries = publicRevenueBoardEntries(
      toPublicLedger([row('2026-09-01', true, { revenueMinor: 123_450, payingCustomers: 3 }), row('2026-02-01', true)]),
      'INR',
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      id: 'ledger-2026-02',
      label: 'Feb 2026',
      value: 5000,
      entryDate: '2026-02-28',
      sourceNote: 'Owner ledger (month shared publicly)',
      example: false,
      evidenceUrl: null,
      payingCustomers: 12,
    });
    expect(entries[1]).toMatchObject({ id: 'ledger-2026-09', label: 'Sep 2026', value: 1234.5, entryDate: '2026-09-30' });
  });

  it('uses the real last day of the month (leap years too)', () => {
    const e = publicRevenueBoardEntries([{ month: '2028-02', revenueMinor: 1, payingCustomers: 1 }], 'INR');
    expect(e[0]!.entryDate).toBe('2028-02-29');
    const d = publicRevenueBoardEntries([{ month: '2026-12', revenueMinor: 1, payingCustomers: 1 }], 'INR');
    expect(d[0]!.entryDate).toBe('2026-12-31');
  });

  it('entries are eligible for ranking', () => {
    const entries = publicRevenueBoardEntries(
      toPublicLedger([row('2026-08-01', true, { revenueMinor: 100 }), row('2026-09-01', true, { revenueMinor: 900 })]),
      'INR',
    );
    const ranked = rankEntries(entries, 'higher');
    expect(ranked.map((r) => [r.entry.label, r.rank])).toEqual([
      ['Sep 2026', 1],
      ['Aug 2026', 2],
    ]);
  });
});
