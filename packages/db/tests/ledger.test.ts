import { describe, expect, it } from 'vitest';
import {
  collectionRate,
  fromMinor,
  margin,
  netMinor,
  summarizeLedger,
  toMinor,
  totalExpensesMinor,
  type LedgerFigures,
} from '../src/domain/ledger';

const month = (over: Partial<LedgerFigures> = {}): LedgerFigures => ({
  revenueMinor: 100_000,
  payingCustomers: 4,
  invoicesRaised: 5,
  invoicesPaid: 4,
  hostingMinor: 10_000,
  speechMinor: 5_000,
  aiUsageMinor: 20_000,
  otherMinor: 5_000,
  ...over,
});

describe('ledger arithmetic', () => {
  it('totals expenses and net', () => {
    const m = month();
    expect(totalExpensesMinor(m)).toBe(40_000);
    expect(netMinor(m)).toBe(60_000);
  });

  it('margin is net / revenue', () => {
    expect(margin(month())).toBeCloseTo(0.6, 10);
  });

  it('margin can be negative', () => {
    const m = month({ revenueMinor: 20_000 });
    expect(netMinor(m)).toBe(-20_000);
    expect(margin(m)).toBe(-1);
  });

  it('margin is null when revenue is 0 (no divide by zero)', () => {
    const m = month({ revenueMinor: 0 });
    expect(margin(m)).toBeNull();
    expect(netMinor(m)).toBe(-40_000);
  });

  it('collection rate is paid / raised', () => {
    expect(collectionRate(month())).toBe(0.8);
    expect(collectionRate(month({ invoicesPaid: 5 }))).toBe(1);
    expect(collectionRate(month({ invoicesPaid: 0 }))).toBe(0);
  });

  it('collection rate is null when no invoices were raised (no divide by zero)', () => {
    expect(collectionRate(month({ invoicesRaised: 0, invoicesPaid: 0 }))).toBeNull();
  });

  it('all-zero month yields zero totals and null ratios', () => {
    const z = month({
      revenueMinor: 0,
      payingCustomers: 0,
      invoicesRaised: 0,
      invoicesPaid: 0,
      hostingMinor: 0,
      speechMinor: 0,
      aiUsageMinor: 0,
      otherMinor: 0,
    });
    expect(totalExpensesMinor(z)).toBe(0);
    expect(netMinor(z)).toBe(0);
    expect(margin(z)).toBeNull();
    expect(collectionRate(z)).toBeNull();
  });
});

describe('summarizeLedger', () => {
  it('sums every figure and computes ratios on the totals', () => {
    const s = summarizeLedger([month(), month({ revenueMinor: 50_000, invoicesRaised: 5, invoicesPaid: 1 })]);
    expect(s.revenueMinor).toBe(150_000);
    expect(s.payingCustomers).toBe(8);
    expect(s.invoicesRaised).toBe(10);
    expect(s.invoicesPaid).toBe(5);
    expect(s.hostingMinor).toBe(20_000);
    expect(s.aiUsageMinor).toBe(40_000);
    expect(s.netMinor).toBe(150_000 - 80_000);
    expect(s.margin).toBeCloseTo(70_000 / 150_000, 10);
    expect(s.collectionRate).toBe(0.5);
  });

  it('handles an empty list', () => {
    const s = summarizeLedger([]);
    expect(s.revenueMinor).toBe(0);
    expect(s.netMinor).toBe(0);
    expect(s.margin).toBeNull();
    expect(s.collectionRate).toBeNull();
  });
});

describe('toMinor / fromMinor', () => {
  it('converts decimal strings exactly', () => {
    expect(toMinor('1234.5')).toBe(123_450);
    expect(toMinor('1234.56')).toBe(123_456);
    expect(toMinor('0.1')).toBe(10);
    expect(toMinor('0.07')).toBe(7);
    expect(toMinor('19.99')).toBe(1999);
    expect(toMinor('1000')).toBe(100_000);
    expect(toMinor(' 42 ')).toBe(4200);
    expect(toMinor('0')).toBe(0);
    expect(toMinor('-5.25')).toBe(-525);
  });

  it('avoids floating point rounding errors', () => {
    // 1.15 * 100 === 114.99999999999999 in floating point
    expect(toMinor('1.15')).toBe(115);
    expect(toMinor('4.35')).toBe(435);
  });

  it('rejects more than 2 decimal places, NaN and junk', () => {
    expect(() => toMinor('1.234')).toThrow(/2 decimal places/);
    expect(() => toMinor('abc')).toThrow();
    expect(() => toMinor('NaN')).toThrow();
    expect(() => toMinor('')).toThrow();
    expect(() => toMinor('1e5')).toThrow();
    expect(() => toMinor('1.')).toThrow();
  });

  it('fromMinor is the inverse', () => {
    expect(fromMinor(123_450)).toBe(1234.5);
    expect(fromMinor(7)).toBe(0.07);
    expect(fromMinor(toMinor('98765.43'))).toBe(98765.43);
  });
});
