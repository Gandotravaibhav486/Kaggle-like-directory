import { describe, expect, it } from 'vitest';
import {
  agentReplyPayloadSchema,
  boardInputSchema,
  entryInputSchema,
  ledgerMonthInputSchema,
  pastedAgentReplySchema,
  seasonInputSchema,
  slugSchema,
  threadInputSchema,
  toFieldErrors,
} from '../src/domain/validation';

const validEntry = { label: 'Run 1', value: '3.5', entryDate: '2026-09-01', sourceNote: 'Notebook run', evidenceUrl: '' };

function errorsOf(schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } }, v: unknown) {
  const r = schema.safeParse(v);
  expect(r.success).toBe(false);
  return toFieldErrors(r.error as never);
}

describe('entryInputSchema', () => {
  it('accepts a complete entry from form strings', () => {
    const r = entryInputSchema.parse({ ...validEntry, example: 'on' });
    expect(r).toEqual({ label: 'Run 1', value: 3.5, entryDate: '2026-09-01', sourceNote: 'Notebook run', evidenceUrl: null, example: true });
  });

  it('rejects an entry without a date', () => {
    const errs = errorsOf(entryInputSchema, { ...validEntry, entryDate: '' });
    expect(errs.entryDate?.[0]).toContain('Date is required');
  });

  it('rejects an entry without a source note (missing, empty or whitespace)', () => {
    for (const sourceNote of [undefined, '', '   ']) {
      const errs = errorsOf(entryInputSchema, { ...validEntry, sourceNote });
      expect(errs.sourceNote?.[0]).toContain('A source note is required');
    }
  });

  it('rejects a missing or non-numeric value', () => {
    expect(errorsOf(entryInputSchema, { ...validEntry, value: '' }).value?.[0]).toContain('Value must be a number');
    expect(errorsOf(entryInputSchema, { ...validEntry, value: 'abc' }).value?.[0]).toContain('Value must be a number');
    expect(errorsOf(entryInputSchema, { ...validEntry, value: 'Infinity' }).value?.[0]).toContain('Value must be a number');
  });

  it('rejects invalid and far-future dates and non-http URLs', () => {
    expect(errorsOf(entryInputSchema, { ...validEntry, entryDate: '2026-02-30' }).entryDate).toBeDefined();
    expect(errorsOf(entryInputSchema, { ...validEntry, entryDate: '2999-01-01' }).entryDate).toBeDefined();
    expect(errorsOf(entryInputSchema, { ...validEntry, evidenceUrl: 'javascript:alert(1)' }).evidenceUrl).toBeDefined();
  });
});

describe('ledgerMonthInputSchema', () => {
  const valid = {
    month: '2026-09',
    revenue: '12500.50',
    payingCustomers: '3',
    invoicesRaised: '4',
    invoicesPaid: '3',
    hosting: '1000',
    speech: '0',
    aiUsage: '2500.25',
    other: '',
    note: 'September',
    sharedPublicly: 'on',
  };

  it('converts money to minor units', () => {
    expect(ledgerMonthInputSchema.parse(valid)).toEqual({
      month: '2026-09',
      revenueMinor: 1_250_050,
      payingCustomers: 3,
      invoicesRaised: 4,
      invoicesPaid: 3,
      hostingMinor: 100_000,
      speechMinor: 0,
      aiUsageMinor: 250_025,
      otherMinor: 0,
      note: 'September',
      sharedPublicly: true,
    });
  });

  it('rejects invoicesPaid > invoicesRaised on the invoicesPaid field', () => {
    const errs = errorsOf(ledgerMonthInputSchema, { ...valid, invoicesRaised: '2', invoicesPaid: '3' });
    expect(errs.invoicesPaid?.[0]).toBe('Invoices paid cannot exceed invoices raised');
  });

  it('rejects negative amounts and counts', () => {
    expect(errorsOf(ledgerMonthInputSchema, { ...valid, hosting: '-1' }).hosting?.[0]).toBe('Must be zero or more');
    expect(errorsOf(ledgerMonthInputSchema, { ...valid, payingCustomers: '-2' }).payingCustomers?.[0]).toBe('Must be zero or more');
  });

  it('rejects more than 2 decimal places and bad months', () => {
    expect(errorsOf(ledgerMonthInputSchema, { ...valid, revenue: '1.234' }).revenue).toBeDefined();
    expect(errorsOf(ledgerMonthInputSchema, { ...valid, month: '2026-13' }).month).toBeDefined();
    expect(errorsOf(ledgerMonthInputSchema, { ...valid, month: '' }).month).toBeDefined();
  });

  it('defaults sharedPublicly to false (private by default)', () => {
    const { sharedPublicly: _s, ...rest } = valid;
    expect(ledgerMonthInputSchema.parse(rest).sharedPublicly).toBe(false);
  });
});

describe('slugSchema', () => {
  it('accepts lowercase words joined by hyphens', () => {
    expect(slugSchema.parse('mock-interview-v6')).toBe('mock-interview-v6');
    expect(slugSchema.parse('abc')).toBe('abc');
  });
  it('rejects bad slugs with the documented message', () => {
    for (const bad of ['Mock-Interview', 'has space', 'trailing-', '-leading', 'double--hyphen', 'under_score']) {
      const r = slugSchema.safeParse(bad);
      expect(r.success).toBe(false);
      expect(r.error!.issues.map((i) => i.message)).toContain('Use lowercase letters, numbers and hyphens');
    }
  });
  it('rejects too short, too long and reserved slugs', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false);
    expect(slugSchema.safeParse('a'.repeat(61)).success).toBe(false);
    for (const reserved of ['new', 'import', 'admin', 'api']) expect(slugSchema.safeParse(reserved).success).toBe(false);
  });
});

describe('other schemas', () => {
  it('season: endsOn must not precede startsOn; currency defaults to INR', () => {
    const ok = seasonInputSchema.parse({ slug: 'season-two', title: 'Season two', startsOn: '', endsOn: '' });
    expect(ok).toMatchObject({ currency: 'INR', startsOn: null, endsOn: null, tagline: '' });
    const errs = errorsOf(seasonInputSchema, { slug: 'season-two', title: 'Season two', startsOn: '2026-10-01', endsOn: '2026-09-01' });
    expect(errs.endsOn).toBeDefined();
  });

  it('board: empty target becomes null; direction enum enforced', () => {
    const b = boardInputSchema.parse({ title: 'T', objective: 'O', unit: 'u', direction: 'lower', target: '', period: 'p', slug: 'my-board', decimals: '1' });
    expect(b.target).toBeNull();
    expect(b.decimals).toBe(1);
    expect(boardInputSchema.safeParse({ ...b, direction: 'sideways' }).success).toBe(false);
  });

  it('thread: short title message and honeypot', () => {
    const base = { title: 'A real title', tag: 'growth', bodyMd: 'Body', authorName: 'Asha', website: '' };
    expect(threadInputSchema.safeParse(base).success).toBe(true);
    expect(errorsOf(threadInputSchema, { ...base, title: 'Hey' }).title?.[0]).toBe('Title must be at least 5 characters');
    expect(threadInputSchema.safeParse({ ...base, website: 'http://spam' }).success).toBe(false);
  });

  it('agent payload: needs an observation and a biggest risk; pasted needs an agent name', () => {
    const p = { observations: ['x'], suggestions: [{ suggestion: 's', reason: 'r' }], biggestRisk: 'risk', missingInformation: [] };
    expect(agentReplyPayloadSchema.safeParse(p).success).toBe(true);
    expect(agentReplyPayloadSchema.safeParse({ ...p, observations: [] }).success).toBe(false);
    expect(agentReplyPayloadSchema.safeParse({ ...p, biggestRisk: ' ' }).success).toBe(false);
    expect(errorsOf(pastedAgentReplySchema, { ...p, agentName: '' }).agentName).toBeDefined();
  });
});
