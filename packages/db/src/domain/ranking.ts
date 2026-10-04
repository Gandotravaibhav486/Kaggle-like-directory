import type { Direction } from './types';

export interface RankInput {
  id: string;
  value: number;
  entryDate: string | null;
  sourceNote: string | null;
}

export interface Ranked<T> {
  entry: T;
  rank: number | null;
  eligible: boolean;
  reason?: 'missing-date' | 'missing-source' | 'invalid-value';
}

function ineligibleReason(e: RankInput): Ranked<RankInput>['reason'] {
  if (!e.entryDate || e.entryDate.trim() === '') return 'missing-date';
  if (!e.sourceNote || e.sourceNote.trim() === '') return 'missing-source';
  if (typeof e.value !== 'number' || !Number.isFinite(e.value)) return 'invalid-value';
  return undefined;
}

/**
 * Standard competition ranking (1, 1, 3). Ineligible entries (no date, no source note,
 * non-finite value) get rank null and are listed last in input order.
 * Ties are ordered by entryDate ascending, then input order.
 */
export function rankEntries<T extends RankInput>(entries: readonly T[], direction: Direction): Ranked<T>[] {
  const eligible: Array<{ entry: T; index: number }> = [];
  const ineligible: Ranked<T>[] = [];
  entries.forEach((entry, index) => {
    const reason = ineligibleReason(entry);
    if (reason) ineligible.push({ entry, rank: null, eligible: false, reason });
    else eligible.push({ entry, index });
  });

  eligible.sort((a, b) => {
    if (a.entry.value !== b.entry.value) {
      return direction === 'higher' ? b.entry.value - a.entry.value : a.entry.value - b.entry.value;
    }
    const da = a.entry.entryDate ?? '';
    const dbb = b.entry.entryDate ?? '';
    if (da !== dbb) return da < dbb ? -1 : 1;
    return a.index - b.index;
  });

  const ranked: Ranked<T>[] = [];
  let prevValue: number | undefined;
  let prevRank = 0;
  eligible.forEach(({ entry }, i) => {
    const rank = i > 0 && entry.value === prevValue ? prevRank : i + 1;
    prevValue = entry.value;
    prevRank = rank;
    ranked.push({ entry, rank, eligible: true });
  });

  return [...ranked, ...ineligible];
}

/** The rank-1 entry (first by tie order), or null when nothing is eligible. */
export function bestEntry<T extends RankInput>(entries: readonly T[], direction: Direction): T | null {
  const first = rankEntries(entries, direction)[0];
  return first && first.eligible ? first.entry : null;
}

/** higher: target - value; lower: value - target. <= 0 means target met. null when no target. */
export function gapToTarget(value: number, target: number | null, direction: Direction): number | null {
  if (target === null || target === undefined) return null;
  return direction === 'higher' ? target - value : value - target;
}

const clamp01 = (n: number) => (Number.isNaN(n) ? 0 : Math.min(1, Math.max(0, n)));

/** Fraction 0..1 of the way to the target; null when no target. */
export function progressToTarget(value: number, target: number | null, direction: Direction): number | null {
  if (target === null || target === undefined) return null;
  if (direction === 'higher') {
    if (target <= 0) return 1;
    return clamp01(value / target);
  }
  if (value <= target) return 1;
  if (value <= 0) return 1;
  return clamp01(target / value);
}
