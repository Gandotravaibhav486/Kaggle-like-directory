// Sales pipeline arithmetic: outreach email -> reply -> demo -> second call -> contract.
// A prospect has reached a stage when that stage's date, or any later stage's date, is set,
// so a skipped stage (say, straight from demo to contract) still counts as passed through.

export const PIPELINE_STAGES = [
  { key: 'emailed', label: 'Emailed', field: 'emailedOn' },
  { key: 'replied', label: 'Replied', field: 'repliedOn' },
  { key: 'demo', label: 'Demo', field: 'demoOn' },
  { key: 'secondCall', label: '2nd call', field: 'secondCallOn' },
  { key: 'won', label: 'Contract', field: 'wonOn' },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type PipelineStageKey = PipelineStage['key'];
export type PipelineStageField = PipelineStage['field'];
export type ProspectStatus = 'open' | 'won' | 'lost';

/** Stage dates as 'YYYY-MM-DD' strings. */
export interface ProspectDates {
  emailedOn: string;
  repliedOn: string | null;
  demoOn: string | null;
  secondCallOn: string | null;
  wonOn: string | null;
  lostOn: string | null;
}

export interface ProspectRow extends ProspectDates {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string | null;
  channel: string;
  contractValueMinor: number | null;
  note: string;
  example: boolean;
}

/** Index into PIPELINE_STAGES of the furthest stage with a date (0 at least, emailedOn is required). */
export function furthestStageIndex(p: ProspectDates): number {
  for (let i = PIPELINE_STAGES.length - 1; i > 0; i--) {
    if (p[PIPELINE_STAGES[i]!.field]) return i;
  }
  return 0;
}

export function prospectStatus(p: ProspectDates): ProspectStatus {
  if (p.wonOn) return 'won';
  if (p.lostOn) return 'lost';
  return 'open';
}

/** The stage an open prospect moves to next, or null once won or lost. */
export function nextStage(p: ProspectDates): PipelineStage | null {
  if (prospectStatus(p) !== 'open') return null;
  return PIPELINE_STAGES[furthestStageIndex(p) + 1] ?? null;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export interface FunnelStep {
  key: PipelineStageKey;
  label: string;
  /** Prospects that reached this stage or a later one. */
  reached: number;
  /** reached / reached at the previous stage. null for the first stage or when the previous stage is 0. */
  fromPrevious: number | null;
  /** reached / emailed. null when nobody was emailed. */
  fromStart: number | null;
  /** Median days from the previous stage's date to this one, over prospects with both dates. */
  medianDays: number | null;
}

export interface FunnelSummary {
  steps: FunnelStep[];
  open: number;
  won: number;
  lost: number;
  contractValueMinor: number;
}

export function summarizeFunnel(prospects: (ProspectDates & { contractValueMinor?: number | null })[]): FunnelSummary {
  const furthest = prospects.map(furthestStageIndex);
  const steps: FunnelStep[] = PIPELINE_STAGES.map((stage, i) => {
    const reached = furthest.filter((f) => f >= i).length;
    let medianDays: number | null = null;
    if (i > 0) {
      const prevField = PIPELINE_STAGES[i - 1]!.field;
      const gaps = prospects
        .filter((p) => p[prevField] && p[stage.field])
        .map((p) => daysBetween(p[prevField]!, p[stage.field]!));
      medianDays = median(gaps);
    }
    return { key: stage.key, label: stage.label, reached, fromPrevious: null, fromStart: null, medianDays };
  });
  const start = steps[0]!.reached;
  steps.forEach((s, i) => {
    const prev = i > 0 ? steps[i - 1]!.reached : 0;
    s.fromPrevious = i > 0 && prev > 0 ? s.reached / prev : null;
    s.fromStart = start > 0 ? s.reached / start : null;
  });

  let open = 0;
  let won = 0;
  let lost = 0;
  let contractValueMinor = 0;
  for (const p of prospects) {
    const status = prospectStatus(p);
    if (status === 'won') {
      won++;
      contractValueMinor += p.contractValueMinor ?? 0;
    } else if (status === 'lost') lost++;
    else open++;
  }
  return { steps, open, won, lost, contractValueMinor };
}

export interface FunnelCohort {
  /** 'YYYY-MM' of the outreach email. */
  month: string;
  summary: FunnelSummary;
}

/** One funnel per outreach month, newest first. */
export function funnelByEmailedMonth(prospects: ProspectDates[]): FunnelCohort[] {
  const groups = new Map<string, ProspectDates[]>();
  for (const p of prospects) {
    const month = p.emailedOn.slice(0, 7);
    const list = groups.get(month);
    if (list) list.push(p);
    else groups.set(month, [p]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([month, list]) => ({ month, summary: summarizeFunnel(list) }));
}
