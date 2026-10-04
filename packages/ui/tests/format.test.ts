import { describe, expect, it } from 'vitest';
import { cn, formatMoney, formatMonth, formatNumber, formatPercent, formatDate } from '../src/format';

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 0, 'c')).toBe('a b c');
  });
  it('returns empty string for no classes', () => {
    expect(cn()).toBe('');
  });
});

describe('formatMoney (en-IN)', () => {
  it('formats INR minor units with 2 dp and Indian grouping', () => {
    expect(formatMoney(123450, 'INR')).toBe('₹1,234.50');
  });
  it('formats large INR values with lakh/crore grouping', () => {
    expect(formatMoney(1000000000, 'INR')).toBe('₹1,00,00,000.00');
  });
  it('formats zero', () => {
    expect(formatMoney(0, 'INR')).toBe('₹0.00');
  });
});

describe('formatNumber', () => {
  it('formats with default 0 decimals', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });
  it('formats with given decimals', () => {
    expect(formatNumber(1234.5, 2)).toBe('1,234.50');
  });
});

describe('formatPercent', () => {
  it('formats a ratio as a percentage', () => {
    expect(formatPercent(0.1234)).toBe('12.3%');
  });
  it('returns an em dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });
  it('returns an em dash for NaN', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
  });
  it('respects the decimals argument', () => {
    expect(formatPercent(0.5, 0)).toBe('50%');
  });
});

describe('formatMonth', () => {
  it('formats YYYY-MM as short month + year', () => {
    expect(formatMonth('2026-10')).toBe('Oct 2026');
  });
  it('handles January correctly', () => {
    expect(formatMonth('2026-01')).toBe('Jan 2026');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string as "D Mon YYYY"', () => {
    expect(formatDate('2026-10-04')).toBe('4 Oct 2026');
  });
});
