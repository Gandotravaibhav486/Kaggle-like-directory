import { z } from 'zod';
import { toMinor } from './ledger';
import { RESERVED_SLUGS, THREAD_TAGS } from './types';

// ---------------------------------------------------------------------------
// helpers (FormData gives strings; JSON may give numbers/booleans)

const emptyToUndefined = (v: unknown) => (v === null || (typeof v === 'string' && v.trim() === '') ? undefined : v);

/** Checkbox / switch values: true, 'true', 'on', '1' -> true; anything else -> false. */
export const booleanish = z.preprocess(
  (v) => v === true || v === 'true' || v === 'on' || v === '1' || v === 1,
  z.boolean(),
);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidIsoDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const optionalDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine(isValidIsoDate, 'Use a valid date (YYYY-MM-DD)')
    .optional(),
);

const httpUrl = z
  .string()
  .trim()
  .max(2000, 'URL is too long')
  .refine((s) => {
    try {
      const u = new URL(s);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use a full http(s) URL');

const optionalHttpUrl = z.preprocess(emptyToUndefined, httpUrl.optional()).transform((v) => v ?? null);

const honeypot = z
  .preprocess((v) => (v === undefined || v === null ? '' : v), z.string())
  .refine((s) => s === '', 'Leave this field empty')
  .optional();

// ---------------------------------------------------------------------------
// slugs

export const slugSchema = z
  .string({ error: 'Slug is required' })
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(60, 'Slug must be at most 60 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
  .refine((s) => !(RESERVED_SLUGS as readonly string[]).includes(s), 'That slug is reserved');

// ---------------------------------------------------------------------------
// pages

export const pageBodySchema = z.string().max(100_000, 'Page is too long (100,000 characters max)');

// ---------------------------------------------------------------------------
// boards and entries

const optionalFiniteNumber = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
      if (v.trim() === '') return null;
      return Number(v.trim());
    }
    return v;
  },
  z.number({ error: 'Must be a number' }).finite('Must be a number').nullable(),
);

export const boardInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long'),
  objective: z.string().trim().min(1, 'Objective is required').max(500, 'Objective is too long'),
  unit: z.string().trim().min(1, 'Unit is required').max(30, 'Unit is too long'),
  direction: z.enum(['higher', 'lower'], { error: 'Choose higher or lower' }),
  target: optionalFiniteNumber,
  period: z.string().trim().min(1, 'Period is required').max(60, 'Period is too long'),
  slug: slugSchema,
  decimals: z.coerce
    .number({ error: 'Decimals must be a whole number' })
    .int('Decimals must be a whole number')
    .min(0, 'Decimals must be 0 to 4')
    .max(4, 'Decimals must be 0 to 4')
    .default(2),
});
export type BoardInput = z.infer<typeof boardInputSchema>;

function todayPlusOneUtc(): string {
  return new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export const entryInputSchema = z.object({
  label: z.string({ error: 'Label is required' }).trim().min(1, 'Label is required').max(120, 'Label is too long'),
  value: z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? undefined : Number(v.trim())) : v),
    z.number({ error: 'Value must be a number' }).finite('Value must be a number'),
  ),
  entryDate: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'Date is required' })
      .refine(isValidIsoDate, 'Date is required (YYYY-MM-DD)')
      .refine((s) => s <= todayPlusOneUtc(), 'Date cannot be in the future'),
  ),
  sourceNote: z.preprocess(
    (v) => (v === undefined || v === null ? '' : v),
    z
      .string()
      .trim()
      .min(3, 'A source note is required')
      .max(500, 'Source note is too long'),
  ),
  evidenceUrl: optionalHttpUrl,
  example: booleanish.default(false),
});
export type EntryInput = z.infer<typeof entryInputSchema>;

// ---------------------------------------------------------------------------
// ledger

const MAX_MAJOR_MINOR = 1e9 * 100;

/** Decimal string (or number) in major units -> integer minor units. Empty -> 0. */
const moneyField = z
  .preprocess((v) => {
    if (v === undefined || v === null) return '0';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v.trim() === '' ? '0' : v.trim().replace(/,/g, '');
    return v;
  }, z.string())
  .superRefine((s, ctx) => {
    if (/^-/.test(s)) {
      ctx.addIssue({ code: 'custom', message: 'Must be zero or more' });
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(s)) {
      ctx.addIssue({ code: 'custom', message: 'Enter an amount like 1234.50' });
      return;
    }
    if (/\.\d{3,}$/.test(s)) {
      ctx.addIssue({ code: 'custom', message: 'Use at most 2 decimal places' });
      return;
    }
    if (toMinor(s) > MAX_MAJOR_MINOR) ctx.addIssue({ code: 'custom', message: 'Amount is too large' });
  })
  .transform((s) => toMinor(s));

const countField = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'string') return v.trim() === '' ? 0 : Number(v.trim());
    return v;
  },
  z
    .number({ error: 'Must be a whole number' })
    .int('Must be a whole number')
    .min(0, 'Must be zero or more')
    .max(1_000_000, 'Must be 1,000,000 or less'),
);

/**
 * Form field names: month (YYYY-MM), revenue, payingCustomers, invoicesRaised, invoicesPaid,
 * hosting, speech, aiUsage, other (money as major-unit decimal strings), note, sharedPublicly.
 * Output uses *Minor integer fields.
 */
export const ledgerMonthInputSchema = z
  .object({
    month: z.preprocess(
      emptyToUndefined,
      z
        .string({ error: 'Month is required' })
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use a month like 2026-09'),
    ),
    revenue: moneyField,
    payingCustomers: countField,
    invoicesRaised: countField,
    invoicesPaid: countField,
    hosting: moneyField,
    speech: moneyField,
    aiUsage: moneyField,
    other: moneyField,
    note: z
      .preprocess((v) => (v === undefined || v === null ? '' : v), z.string().max(2000, 'Note is too long'))
      .default(''),
    sharedPublicly: booleanish.default(false),
  })
  .refine((d) => d.invoicesPaid <= d.invoicesRaised, {
    path: ['invoicesPaid'],
    message: 'Invoices paid cannot exceed invoices raised',
  })
  .transform((d) => ({
    month: d.month,
    revenueMinor: d.revenue,
    payingCustomers: d.payingCustomers,
    invoicesRaised: d.invoicesRaised,
    invoicesPaid: d.invoicesPaid,
    hostingMinor: d.hosting,
    speechMinor: d.speech,
    aiUsageMinor: d.aiUsage,
    otherMinor: d.other,
    note: d.note,
    sharedPublicly: d.sharedPublicly,
  }));
export type LedgerMonthInput = z.output<typeof ledgerMonthInputSchema>;

// ---------------------------------------------------------------------------
// seasons

export const seasonInputSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
    tagline: z
      .preprocess((v) => (v === undefined || v === null ? '' : v), z.string().trim().max(200, 'Tagline is too long'))
      .default(''),
    startsOn: optionalDate.transform((v) => v ?? null),
    endsOn: optionalDate.transform((v) => v ?? null),
    currency: z
      .preprocess(
        (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? 'INR' : v),
        z.string().trim().regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code like INR'),
      )
      .default('INR'),
  })
  .refine((d) => !d.startsOn || !d.endsOn || d.endsOn >= d.startsOn, {
    path: ['endsOn'],
    message: 'End date must be on or after the start date',
  });
export type SeasonInput = z.output<typeof seasonInputSchema>;

// ---------------------------------------------------------------------------
// discussion

export const threadInputSchema = z.object({
  title: z
    .string({ error: 'Title must be at least 5 characters' })
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(140, 'Title must be at most 140 characters'),
  tag: z.enum(THREAD_TAGS, { error: 'Choose a tag' }),
  bodyMd: z.string({ error: 'Write something' }).trim().min(1, 'Write something').max(20_000, 'Post is too long'),
  authorName: z
    .string({ error: 'Your name is required' })
    .trim()
    .min(1, 'Your name is required')
    .max(60, 'Name is too long'),
  website: honeypot,
});
export type ThreadInput = z.infer<typeof threadInputSchema>;

export const replyInputSchema = z.object({
  bodyMd: z.string({ error: 'Write something' }).trim().min(1, 'Write something').max(10_000, 'Reply is too long'),
  authorName: z
    .string({ error: 'Your name is required' })
    .trim()
    .min(1, 'Your name is required')
    .max(60, 'Name is too long'),
  website: honeypot,
});
export type ReplyInput = z.infer<typeof replyInputSchema>;

// ---------------------------------------------------------------------------
// agents

export const agentReplyPayloadSchema = z.object({
  observations: z
    .array(z.string().trim().min(1).max(1000))
    .min(1, 'Add at least one observation')
    .max(10),
  suggestions: z
    .array(
      z.object({
        suggestion: z.string().trim().min(1).max(500),
        reason: z.string().trim().min(1, 'Every suggestion needs a reason').max(1000),
      }),
    )
    .max(10),
  biggestRisk: z.string().trim().min(1, 'Biggest risk is required').max(1000),
  missingInformation: z.array(z.string().trim().min(1).max(500)).max(10),
});
export type AgentReplyPayload = z.infer<typeof agentReplyPayloadSchema>;

/** Same shape without min/max, for structured-output generation. Always re-validate with the strict schema. */
export const agentReplyModelSchema = z.object({
  observations: z.array(z.string()),
  suggestions: z.array(z.object({ suggestion: z.string(), reason: z.string() })),
  biggestRisk: z.string(),
  missingInformation: z.array(z.string()),
});

export const pastedAgentReplySchema = agentReplyPayloadSchema.extend({
  agentName: z
    .string({ error: 'Agent name is required' })
    .trim()
    .min(1, 'Agent name is required')
    .max(60, 'Agent name is too long'),
});
export type PastedAgentReply = z.infer<typeof pastedAgentReplySchema>;

export const agentTokenInputSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(60, 'Name is too long'),
  rateLimit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int('Must be a whole number').min(1, 'Must be 1 to 120').max(120, 'Must be 1 to 120').default(10),
  ),
  rateWindowSeconds: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int('Must be a whole number')
      .min(10, 'Must be 10 to 3600 seconds')
      .max(3600, 'Must be 10 to 3600 seconds')
      .default(60),
  ),
});
export type AgentTokenInput = z.infer<typeof agentTokenInputSchema>;

export const resourceInputSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(120, 'Name is too long'),
  kind: z.enum(['model', 'service', 'dataset', 'tool', 'platform', 'channel'], { error: 'Choose a kind' }),
  url: optionalHttpUrl,
  usedFor: z
    .string({ error: 'Say what it is used for' })
    .trim()
    .min(1, 'Say what it is used for')
    .max(500, 'Too long'),
  notes: z
    .preprocess((v) => (v === undefined || v === null ? '' : v), z.string().trim().max(2000, 'Notes are too long'))
    .default(''),
});
export type ResourceInput = z.infer<typeof resourceInputSchema>;

// ---------------------------------------------------------------------------
// action results

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> };

/** Flattens zod issues into { 'field.path': [messages] }. Root issues go under '_form'. */
export function toFieldErrors(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.length ? issue.path.map(String).join('.') : '_form';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
