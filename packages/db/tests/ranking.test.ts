import { describe, expect, it } from 'vitest';
import { bestEntry, gapToTarget, progressToTarget, rankEntries, type RankInput } from '../src/domain/ranking';

const e = (id: string, value: number, entryDate: string | null = '2026-09-01', sourceNote: string | null = 'measured'): RankInput => ({
  id,
  value,
  entryDate,
  sourceNote,
});

const order = (r: ReturnType<typeof rankEntries>) => r.map((x) => x.entry.id);
const ranks = (r: ReturnType<typeof rankEntries>) => r.map((x) => x.rank);

describe('rankEntries', () => {
  const entries = [e('a', 10), e('b', 30), e('c', 20)];

  it('ranks higher-is-better descending', () => {
    const r = rankEntries(entries, 'higher');
    expect(order(r)).toEqual(['b', 'c', 'a']);
    expect(ranks(r)).toEqual([1, 2, 3]);
  });

  it('ranks lower-is-better ascending', () => {
    const r = rankEntries(entries, 'lower');
    expect(order(r)).toEqual(['a', 'c', 'b']);
    expect(ranks(r)).toEqual([1, 2, 3]);
  });

  it('ties share a rank and the next rank is skipped (higher)', () => {
    const r = rankEntries([e('a', 5), e('b', 9), e('c', 9), e('d', 1)], 'higher');
    expect(order(r)).toEqual(['b', 'c', 'a', 'd']);
    expect(ranks(r)).toEqual([1, 1, 3, 4]);
  });

  it('ties share a rank and the next rank is skipped (lower)', () => {
    const r = rankEntries([e('a', 5), e('b', 2), e('c', 2), e('d', 7)], 'lower');
    expect(order(r)).toEqual(['b', 'c', 'a', 'd']);
    expect(ranks(r)).toEqual([1, 1, 3, 4]);
  });

  it('ties in the middle produce 1, 2, 2, 4', () => {
    const r = rankEntries([e('a', 1), e('b', 3), e('c', 3), e('d', 4)], 'lower');
    expect(ranks(r)).toEqual([1, 2, 2, 4]);
  });

  it('orders ties by entryDate ascending, then input order', () => {
    const r = rankEntries(
      [e('late', 5, '2026-09-10'), e('early', 5, '2026-09-01'), e('same1', 5, '2026-09-05'), e('same2', 5, '2026-09-05')],
      'higher',
    );
    expect(order(r)).toEqual(['early', 'same1', 'same2', 'late']);
    expect(ranks(r)).toEqual([1, 1, 1, 1]);
  });

  it('lists entries without a date or source note last, unranked, in input order', () => {
    const r = rankEntries(
      [e('noDate', 100, null), e('ok1', 1), e('blankSource', 50, '2026-09-01', '   '), e('noSource', 70, '2026-09-01', null), e('ok2', 2)],
      'higher',
    );
    expect(order(r)).toEqual(['ok2', 'ok1', 'noDate', 'blankSource', 'noSource']);
    expect(ranks(r)).toEqual([1, 2, null, null, null]);
    expect(r[2]).toMatchObject({ eligible: false, reason: 'missing-date' });
    expect(r[3]).toMatchObject({ eligible: false, reason: 'missing-source' });
    expect(r[4]).toMatchObject({ eligible: false, reason: 'missing-source' });
  });

  it('treats an empty date string as missing', () => {
    expect(rankEntries([e('x', 1, '')], 'higher')[0]).toMatchObject({ rank: null, reason: 'missing-date' });
  });

  it('NaN and Infinity are unranked with reason invalid-value', () => {
    const r = rankEntries([e('nan', Number.NaN), e('inf', Number.POSITIVE_INFINITY), e('ok', 3)], 'higher');
    expect(order(r)).toEqual(['ok', 'nan', 'inf']);
    expect(r[1]).toMatchObject({ rank: null, eligible: false, reason: 'invalid-value' });
    expect(r[2]).toMatchObject({ rank: null, eligible: false, reason: 'invalid-value' });
  });

  it('compares values exactly (no epsilon)', () => {
    const r = rankEntries([e('a', 0.1 + 0.2), e('b', 0.3)], 'higher');
    expect(ranks(r)).toEqual([1, 2]);
  });

  it('handles an empty list and does not mutate the input', () => {
    expect(rankEntries([], 'higher')).toEqual([]);
    const input = [e('a', 1), e('b', 2)];
    rankEntries(input, 'higher');
    expect(input.map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('bestEntry', () => {
  it('returns the rank-1 entry for each direction', () => {
    const entries = [e('a', 10), e('b', 30), e('c', 20)];
    expect(bestEntry(entries, 'higher')?.id).toBe('b');
    expect(bestEntry(entries, 'lower')?.id).toBe('a');
  });
  it('returns the first by tie order', () => {
    expect(bestEntry([e('x', 5, '2026-09-09'), e('y', 5, '2026-09-02')], 'higher')?.id).toBe('y');
  });
  it('ignores ineligible entries and returns null when none are eligible', () => {
    expect(bestEntry([e('x', 999, null), e('y', 1)], 'higher')?.id).toBe('y');
    expect(bestEntry([e('x', 999, null)], 'higher')).toBeNull();
    expect(bestEntry([], 'lower')).toBeNull();
  });
});

describe('gapToTarget', () => {
  it('is null without a target', () => {
    expect(gapToTarget(5, null, 'higher')).toBeNull();
    expect(gapToTarget(5, null, 'lower')).toBeNull();
  });
  it('higher: target - value (<= 0 means met)', () => {
    expect(gapToTarget(80, 100, 'higher')).toBe(20);
    expect(gapToTarget(100, 100, 'higher')).toBe(0);
    expect(gapToTarget(120, 100, 'higher')).toBe(-20);
  });
  it('lower: value - target (<= 0 means met)', () => {
    expect(gapToTarget(3, 2, 'lower')).toBe(1);
    expect(gapToTarget(2, 2, 'lower')).toBe(0);
    expect(gapToTarget(1.5, 2, 'lower')).toBe(-0.5);
  });
  it('handles zero values and zero targets', () => {
    expect(gapToTarget(0, 0, 'higher')).toBe(0);
    expect(gapToTarget(0, 10, 'higher')).toBe(10);
    expect(gapToTarget(4, 0, 'lower')).toBe(4);
  });
});

describe('progressToTarget', () => {
  it('is null without a target', () => {
    expect(progressToTarget(1, null, 'higher')).toBeNull();
    expect(progressToTarget(1, null, 'lower')).toBeNull();
  });
  it('higher: value / target clamped to 0..1', () => {
    expect(progressToTarget(50, 100, 'higher')).toBe(0.5);
    expect(progressToTarget(150, 100, 'higher')).toBe(1);
    expect(progressToTarget(-5, 100, 'higher')).toBe(0);
    expect(progressToTarget(0, 100, 'higher')).toBe(0);
  });
  it('higher: a target of 0 or less counts as met', () => {
    expect(progressToTarget(0, 0, 'higher')).toBe(1);
    expect(progressToTarget(-3, -1, 'higher')).toBe(1);
  });
  it('lower: target / value clamped, met when value <= target', () => {
    expect(progressToTarget(4, 2, 'lower')).toBe(0.5);
    expect(progressToTarget(2, 2, 'lower')).toBe(1);
    expect(progressToTarget(1, 2, 'lower')).toBe(1);
  });
  it('lower: zero values do not divide by zero', () => {
    expect(progressToTarget(0, 0, 'lower')).toBe(1);
    expect(progressToTarget(0, 2, 'lower')).toBe(1);
    expect(progressToTarget(5, 0, 'lower')).toBe(0);
    expect(progressToTarget(-1, -2, 'lower')).toBe(1);
  });
});
