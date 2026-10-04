import { describe, expect, it } from 'vitest';
import { csvCell, ledgerToCsv, pipelineToCsv } from '../src/domain/csv';
import type { ProspectRow } from '../src/domain/pipeline';
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

describe('pipelineToCsv', () => {
  const prospect = (over: Partial<ProspectRow> = {}): ProspectRow => ({
    id: 'p',
    company: 'Acme Campus',
    contactName: 'Priya',
    contactEmail: 'priya@acme.example',
    channel: 'Cold email',
    emailedOn: '2026-09-01',
    repliedOn: '2026-09-03',
    demoOn: null,
    secondCallOn: null,
    wonOn: null,
    lostOn: null,
    contractValueMinor: null,
    note: '',
    example: false,
    ...over,
  });

  it('writes the header, the derived stage and status, and blank unset dates', () => {
    const lines = pipelineToCsv([prospect()]).trimEnd().split('\r\n');
    expect(lines[0]).toBe(
      'company,contact_name,contact_email,channel,stage,status,emailed_on,replied_on,demo_on,second_call_on,contract_on,lost_on,contract_value,example,note',
    );
    expect(lines[1]).toBe('Acme Campus,Priya,priya@acme.example,Cold email,Replied,open,2026-09-01,2026-09-03,,,,,,false,');
  });

  it('writes contract value in major units and guards formula-like text', () => {
    const csv = pipelineToCsv([
      prospect({ company: '=HYPERLINK("x")', wonOn: '2026-09-20', contractValueMinor: 4_000_050, note: 'a, b' }),
    ]);
    const line = csv.trimEnd().split('\r\n')[1]!;
    expect(line.startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true);
    expect(line).toContain(',Contract,won,');
    expect(line).toContain(',40000.50,false,"a, b"');
  });
});
