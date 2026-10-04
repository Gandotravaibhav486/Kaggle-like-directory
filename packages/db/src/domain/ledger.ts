export interface LedgerFigures {
  revenueMinor: number;
  payingCustomers: number;
  invoicesRaised: number;
  invoicesPaid: number;
  hostingMinor: number;
  speechMinor: number;
  aiUsageMinor: number;
  otherMinor: number;
}

export function totalExpensesMinor(m: LedgerFigures): number {
  return m.hostingMinor + m.speechMinor + m.aiUsageMinor + m.otherMinor;
}

export function netMinor(m: LedgerFigures): number {
  return m.revenueMinor - totalExpensesMinor(m);
}

/** net / revenue as a ratio (may be negative). null when revenue is 0 or less. */
export function margin(m: LedgerFigures): number | null {
  return m.revenueMinor > 0 ? netMinor(m) / m.revenueMinor : null;
}

/** invoicesPaid / invoicesRaised. null when no invoices were raised. */
export function collectionRate(m: LedgerFigures): number | null {
  return m.invoicesRaised > 0 ? m.invoicesPaid / m.invoicesRaised : null;
}

export function summarizeLedger(
  months: LedgerFigures[],
): LedgerFigures & { netMinor: number; margin: number | null; collectionRate: number | null } {
  const total: LedgerFigures = {
    revenueMinor: 0,
    payingCustomers: 0,
    invoicesRaised: 0,
    invoicesPaid: 0,
    hostingMinor: 0,
    speechMinor: 0,
    aiUsageMinor: 0,
    otherMinor: 0,
  };
  for (const m of months) {
    total.revenueMinor += m.revenueMinor;
    total.payingCustomers += m.payingCustomers;
    total.invoicesRaised += m.invoicesRaised;
    total.invoicesPaid += m.invoicesPaid;
    total.hostingMinor += m.hostingMinor;
    total.speechMinor += m.speechMinor;
    total.aiUsageMinor += m.aiUsageMinor;
    total.otherMinor += m.otherMinor;
  }
  return { ...total, netMinor: netMinor(total), margin: margin(total), collectionRate: collectionRate(total) };
}

const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/** "1234.5" -> 123450. Throws on NaN, empty, or more than 2 decimal places. Exact (no float maths). */
export function toMinor(major: string): number {
  const s = String(major).trim();
  const m = DECIMAL_RE.exec(s);
  if (!m) {
    if (/^-?\d+\.\d{3,}$/.test(s)) throw new Error('Use at most 2 decimal places');
    throw new Error('Not a valid amount');
  }
  const [, sign, whole = '0', frac = ''] = m;
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) throw new Error('Amount is too large');
  return sign && minor !== 0 ? -minor : minor;
}

/** 123450 -> 1234.5 */
export function fromMinor(minor: number): number {
  return minor / 100;
}
