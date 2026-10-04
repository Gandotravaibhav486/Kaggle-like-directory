import { describe, expect, it } from 'vitest';
import {
  funnelByEmailedMonth,
  furthestStageIndex,
  median,
  nextStage,
  prospectStatus,
  summarizeFunnel,
  type ProspectDates,
} from '../src/domain/pipeline';
import { prospectInputSchema } from '../src/domain/validation';

const p = (over: Partial<ProspectDates> = {}): ProspectDates => ({
  emailedOn: '2026-09-01',
  repliedOn: null,
  demoOn: null,
  secondCallOn: null,
  wonOn: null,
  lostOn: null,
  ...over,
});

describe('pipeline stages', () => {
  it('derives the furthest stage, counting skipped stages as passed', () => {
    expect(furthestStageIndex(p())).toBe(0);
    expect(furthestStageIndex(p({ repliedOn: '2026-09-02' }))).toBe(1);
    expect(furthestStageIndex(p({ demoOn: '2026-09-05', wonOn: '2026-09-20' }))).toBe(4);
  });

  it('derives status and the next stage', () => {
    expect(prospectStatus(p())).toBe('open');
    expect(prospectStatus(p({ wonOn: '2026-09-20' }))).toBe('won');
    expect(prospectStatus(p({ lostOn: '2026-09-10' }))).toBe('lost');
    expect(nextStage(p())?.key).toBe('replied');
    expect(nextStage(p({ demoOn: '2026-09-05' }))?.key).toBe('secondCall');
    expect(nextStage(p({ lostOn: '2026-09-10' }))).toBeNull();
    expect(nextStage(p({ wonOn: '2026-09-20' }))).toBeNull();
  });

  it('takes the median of odd and even lists, null when empty', () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('summarizeFunnel', () => {
  const prospects = [
    p(),
    p({ lostOn: '2026-09-04' }),
    p({ repliedOn: '2026-09-03' }),
    p({ repliedOn: '2026-09-05', demoOn: '2026-09-10' }),
    p({ repliedOn: '2026-09-02', demoOn: '2026-09-06', secondCallOn: '2026-09-12', wonOn: '2026-09-30' }),
  ].map((d, i) => ({ ...d, contractValueMinor: i === 4 ? 2_500_000 : null }));

  it('counts how many reached each stage and the conversion rates', () => {
    const s = summarizeFunnel(prospects);
    expect(s.steps.map((x) => x.reached)).toEqual([5, 3, 2, 1, 1]);
    expect(s.steps[0]!.fromPrevious).toBeNull();
    expect(s.steps[1]!.fromPrevious).toBeCloseTo(3 / 5);
    expect(s.steps[2]!.fromPrevious).toBeCloseTo(2 / 3);
    expect(s.steps[3]!.fromPrevious).toBeCloseTo(1 / 2);
    expect(s.steps[4]!.fromPrevious).toBe(1);
    expect(s.steps[4]!.fromStart).toBeCloseTo(1 / 5);
  });

  it('computes median days between consecutive stages', () => {
    const s = summarizeFunnel(prospects);
    expect(s.steps[0]!.medianDays).toBeNull();
    expect(s.steps[1]!.medianDays).toBe(2); // 1, 2, 4 days to reply
    expect(s.steps[2]!.medianDays).toBe(4.5); // 4 and 5 days to demo
    expect(s.steps[4]!.medianDays).toBe(18);
  });

  it('counts open, won and lost, and sums contract value of won prospects only', () => {
    const s = summarizeFunnel(prospects);
    expect({ open: s.open, won: s.won, lost: s.lost }).toEqual({ open: 3, won: 1, lost: 1 });
    expect(s.contractValueMinor).toBe(2_500_000);
  });

  it('returns null rates for an empty pipeline', () => {
    const s = summarizeFunnel([]);
    expect(s.steps.every((x) => x.reached === 0 && x.fromStart === null && x.fromPrevious === null)).toBe(true);
  });

  it('groups cohorts by outreach month, newest first', () => {
    const cohorts = funnelByEmailedMonth([p({ emailedOn: '2026-08-15' }), p(), p({ repliedOn: '2026-09-02' })]);
    expect(cohorts.map((c) => c.month)).toEqual(['2026-09', '2026-08']);
    expect(cohorts[0]!.summary.steps[1]!.reached).toBe(1);
  });
});

describe('prospectInputSchema', () => {
  const base = { company: 'Acme', emailedOn: '2026-09-01' };

  it('accepts a minimal prospect and normalises blanks', () => {
    const d = prospectInputSchema.parse({ ...base, repliedOn: '', contactEmail: '', contractValue: '' });
    expect(d).toMatchObject({ company: 'Acme', repliedOn: null, contactEmail: null, contractValueMinor: null, example: false });
  });

  it('requires company and outreach date', () => {
    const r = prospectInputSchema.safeParse({ company: ' ', emailedOn: '' });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['company', 'emailedOn']));
  });

  it('rejects stage dates that go backwards, skipping blanks', () => {
    const r = prospectInputSchema.safeParse({ ...base, repliedOn: '2026-09-05', secondCallOn: '2026-09-04' });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(['secondCallOn']);
  });

  it('rejects won and lost together, and a contract value without a contract', () => {
    const r = prospectInputSchema.safeParse({ ...base, wonOn: '2026-09-10', lostOn: '2026-09-11' });
    expect(r.success).toBe(false);
    const v = prospectInputSchema.safeParse({ ...base, contractValue: '5000' });
    expect(v.success).toBe(false);
    expect(v.error!.issues[0]!.path).toEqual(['contractValue']);
  });

  it('converts contract value to minor units', () => {
    const d = prospectInputSchema.parse({ ...base, wonOn: '2026-09-20', contractValue: '25,000.50' });
    expect(d.contractValueMinor).toBe(2_500_050);
  });

  it('rejects future dates and bad emails', () => {
    const r = prospectInputSchema.safeParse({ ...base, emailedOn: '2999-01-01', contactEmail: 'nope' });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['emailedOn', 'contactEmail']));
  });
});
