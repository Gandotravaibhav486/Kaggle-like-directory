import { describe, expect, it } from 'vitest';
import { csvCell, ledgerToCsv } from '../src/domain/csv';
import type { LedgerMonthRow } from '../src/domain/public-ledger';

const row = (over: Partial<LedgerMonthRow> = {}): LedgerMonthRow => ({
  id: 'x',
  month: '2026-09-01',
  revenueMinor: 1_250_050,
  payingCustomers: 3,
  invoicesRaised: 4,
  invoicesPaid: 3,
  hostingMinor: 100_000,
  speechMinor: 0,
  aiUsageMinor: 250_025,
  otherMinor: 0,
  note: 'ok',
  sharedPublicly: false,
  ...over,
});

describe('ledgerToCsv', () => {
  it('writes the documented header and a row in major units', () => {
    const lines = ledgerToCsv([row()], 'INR').trimEnd().split('\r\n');
    expect(lines[0]).toBe(
      'month,revenue,paying_customers,invoices_raised,invoices_paid,hosting,speech,ai_usage,other,total_expenses,net,margin,collection_rate,shared_publicly,note',
    );
    expect(lines[1]).toBe('2026-09,12500.50,3,4,3,1000.00,0.00,2500.25,0.00,3500.25,9000.25,0.7200,0.7500,false,ok');
  });

  it('leaves undefined ratios empty and keeps negative net numeric', () => {
    const line = ledgerToCsv([row({ revenueMinor: 0, invoicesRaised: 0, invoicesPaid: 0 })], 'INR').split('\r\n')[1]!;
    expect(line).toContain(',-3500.25,,,');
  });

  it('quotes commas, quotes and newlines (RFC 4180)', () => {
    const line = ledgerToCsv([row({ note: 'a, "b"\nc' })], 'INR').split('\r\n').slice(1).join('\r\n');
    expect(line.endsWith(',"a, ""b""\nc"\r\n')).toBe(true);
  });

  it('guards against CSV injection in text cells', () => {
    for (const evil of ['=HYPERLINK("x")', '+1', '-1', '@SUM(A1)']) {
      const csv = ledgerToCsv([row({ note: evil })], 'INR');
      expect(csv).toContain(csvCell(evil));
      expect(csvCell(evil).replace(/^"/, '').startsWith("'")).toBe(true);
    }
  });

  it('sorts rows by month', () => {
    const csv = ledgerToCsv([row({ month: '2026-09-01' }), row({ month: '2026-07-01' })], 'INR');
    const months = csv.trimEnd().split('\r\n').slice(1).map((l) => l.slice(0, 7));
    expect(months).toEqual(['2026-07', '2026-09']);
  });
});
