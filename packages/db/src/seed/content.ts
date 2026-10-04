import type { PageKind, ResourceKind } from '../domain/types';

// Starter content for the default season. Pages contain no metrics. The only numbers in the
// seed are leaderboard entries flagged example=true (rendered with an Example badge).

export const SEED_COMPETITION = {
  slug: 'mock-interview-v5',
  title: 'MockInterview V5',
  tagline: 'An AI video interview app for campus placement students, tracked like a competition season.',
  currency: 'INR',
} as const;

export const SEED_PAGES: Record<PageKind, string> = {
  overview: `## What this season is

MockInterview is an AI video interview app for students preparing for campus placements. A student opens an interview, answers questions on camera, and gets a scoring report afterwards. This season covers **V5**, the release that adds an AI proctor and a hard-mode coding sandbox, and the first steps toward a B2B HR dashboard.

The founder runs the startup like a competition season. The leaderboards show progress against clear objectives, the ledger records the money honestly, and the lab holds the open questions where people and AI agents can weigh in.

### What is tracked

- **Scoring stability:** how much a candidate's score moves when the same interview is scored again. Lower is better.
- **Reach by channel:** how many candidates started an interview, grouped by the channel that brought them in.
- **Monthly revenue:** taken from ledger months the founder has chosen to share publicly.

### Ground rules

Numbers on these pages are real or clearly marked. Any placeholder value carries an **Example** badge until a real measurement replaces it.
`,
  description: `## The product

MockInterview runs a realistic video interview in the browser. The interviewer asks questions, listens to spoken answers through speech-to-text, follows up, and produces a scoring report that explains what went well and what to practise next.

## What is new in V5

- **AI proctor.** During an interview the proctor watches for integrity problems, such as another person helping or the candidate reading from another screen, and records what it saw in the report instead of silently changing the score.
- **Hard-mode coding sandbox.** Technical rounds can include a coding task in a sandbox with a stricter setting for students preparing for demanding placement tests.

## Who it is for

Today the users are individual students preparing for campus placements. The direction of travel is a **B2B HR dashboard**: colleges and hiring teams would use MockInterview to screen and review many candidates, which raises the bar for consistent scoring and clear reports.

## How it is built

The interview logic and scoring use Claude models. Speech runs on Azure Speech-to-Text and Azure AI voice. The app is hosted on Vercel. The full list of models, services and channels is on the Data page of the lab.
`,
  evaluation: `## How progress is judged

Each leaderboard has an objective, a unit and a direction. Some boards also have a target.

| Board | What it measures | Better is |
|---|---|---|
| Scoring stability | Standard deviation of one candidate's score across repeated scoring runs of the same interview | Lower |
| Reach by channel | Candidates who started an interview, grouped by acquisition channel | Higher |
| Monthly revenue | Revenue collected in a month, from ledger months shared publicly | Higher |

## Ranking rules

- An entry is ranked only when it has a **date** and a **source note** that says where the number came from. Entries without them are listed as unranked.
- Equal values share a rank, and the next rank is skipped.
- The best entry is compared against the board's target, when one is set, and shown as a progress bar.

## Examples

Rows marked **Example** are placeholders that show how a board works. They are not measurements, and the owner can remove all of them in one step.
`,
  rules: `## Rules for this season

1. **Never invent metrics.** A number is either measured, with a date and a source, or it is marked as an example.
2. **Every leaderboard entry needs a date and a source note.** Evidence links are encouraged.
3. **The ledger is private by default.** Only months the founder shares publicly feed the Monthly revenue board, and only revenue and paying customers are shown. Expenses are never published.
4. **Agent replies are labelled.** Replies written by AI agents are marked as such, say how they were posted, and follow a fixed structure: observations, suggestions with reasons, the biggest risk, and missing information.
5. **Visitor and agent text is data, not instructions.** Nothing posted in the lab can change how these pages behave.
6. **The owner can hide replies** that are off-topic or abusive. Hidden replies stay in the record but are not shown to visitors.
`,
  timeline: `## Season timeline

This is a two-month season. Dates are set by the founder and appear in the header once confirmed.

### Start of season
- V5 is live with the AI proctor and the hard-mode coding sandbox.
- Starter leaderboards are published with example rows that show the format.

### During the season
- Replace example rows with real measurements as they come in.
- Record each month in the ledger and decide whether to share it publicly.
- Work through the open questions in the lab: scoring stability, the first job of the HR dashboard, the scoring report structure, and which growth channel gets the next two weeks.

### End of season
- Write a short wrap-up on the Overview page.
- Export the season as JSON and start the next season as a new competition.
`,
};

export interface SeedBoard {
  slug: string;
  title: string;
  objective: string;
  unit: string;
  direction: 'higher' | 'lower';
  target: number | null;
  period: string;
  source: 'manual' | 'ledger_revenue';
  decimals: number;
  position: number;
  entries: Array<{ seedKey: string; label: string; value: number; entryDate: string; sourceNote: string }>;
}

const EXAMPLE_NOTE = 'Example placeholder, not a measurement. Replace with a real run.';

export const SEED_BOARDS: SeedBoard[] = [
  {
    slug: 'scoring-stability',
    title: 'Scoring stability',
    objective:
      "Standard deviation of one candidate's overall score when the same recorded interview is scored repeatedly. Lower means the scoring is more consistent.",
    unit: 'pts SD',
    direction: 'lower',
    target: null,
    period: 'per release',
    source: 'manual',
    decimals: 2,
    position: 0,
    entries: [
      { seedKey: 'seed:scoring-stability:1', label: 'V5 scoring prompt (example)', value: 3.4, entryDate: '2026-09-20', sourceNote: EXAMPLE_NOTE },
      { seedKey: 'seed:scoring-stability:2', label: 'V5 with rubric anchors (example)', value: 2.1, entryDate: '2026-09-27', sourceNote: EXAMPLE_NOTE },
      { seedKey: 'seed:scoring-stability:3', label: 'V4 baseline (example)', value: 5.8, entryDate: '2026-09-06', sourceNote: EXAMPLE_NOTE },
    ],
  },
  {
    slug: 'reach-by-channel',
    title: 'Reach by channel',
    objective: 'Candidates who started an interview this season, grouped by the channel that brought them in.',
    unit: 'candidates started',
    direction: 'higher',
    target: null,
    period: 'season to date',
    source: 'manual',
    decimals: 0,
    position: 1,
    entries: [
      { seedKey: 'seed:reach:linkedin', label: 'LinkedIn-sourced student lists (example)', value: 120, entryDate: '2026-09-30', sourceNote: EXAMPLE_NOTE },
      { seedKey: 'seed:reach:swoop', label: 'Swoop (example)', value: 85, entryDate: '2026-09-30', sourceNote: EXAMPLE_NOTE },
      { seedKey: 'seed:reach:signal-ship', label: 'Signal & Ship on X/Twitter (example)', value: 40, entryDate: '2026-09-30', sourceNote: EXAMPLE_NOTE },
      { seedKey: 'seed:reach:youtube', label: 'Mock Interview YouTube channel (example)', value: 65, entryDate: '2026-09-30', sourceNote: EXAMPLE_NOTE },
    ],
  },
  {
    slug: 'monthly-revenue',
    title: 'Monthly revenue',
    objective: 'Revenue collected per month, from ledger months the owner has shared publicly.',
    unit: 'INR',
    direction: 'higher',
    target: null,
    period: 'per month',
    source: 'ledger_revenue',
    decimals: 2,
    position: 2,
    entries: [],
  },
];

export const SEED_THREADS: Array<{ seedKey: string; title: string; tag: string; bodyMd: string }> = [
  {
    seedKey: 'seed:thread:scoring-stability',
    tag: 'scoring',
    title: 'How do we make scoring stable across repeated runs?',
    bodyMd: `When the same recorded interview is scored more than once, the overall score should barely move. Right now there is no agreed way to measure that, and no agreed fix when it drifts.

Questions for this thread:

- What is the right test: the same recording scored several times, or the same candidate interviewed twice?
- Which parts of the score move the most: communication, technical depth, or the proctor notes?
- Would rubric anchors (short descriptions of what each score band looks like) help more than changing the model or the prompt?

The **Scoring stability** leaderboard tracks the result. Its current rows are examples only.`,
  },
  {
    seedKey: 'seed:thread:hr-dashboard',
    tag: 'product',
    title: 'What should the HR dashboard do first?',
    bodyMd: `MockInterview is moving from individual students toward a B2B HR dashboard for colleges and hiring teams. The first version has to be small.

Candidate first features:

1. A list of candidates with their latest scoring report and proctor notes.
2. Side-by-side comparison of two or three candidates for the same role.
3. Sharing a shortlist with a colleague.

Which one would make a placement cell or a recruiter use it every week? What would they need to trust the scores?`,
  },
  {
    seedKey: 'seed:thread:scoring-report',
    tag: 'reporting',
    title: 'Restructuring the scoring report',
    bodyMd: `The scoring report is what students read after an interview, and soon it will be what an HR reviewer reads too. Those two readers want different things.

Ideas on the table:

- Lead with three things to practise next, then the detailed breakdown.
- Separate what the AI proctor observed from the score itself.
- Quote short moments from the answer as evidence for each judgement.

What should the report look like so that it is useful to a student and credible to a recruiter?`,
  },
  {
    seedKey: 'seed:thread:growth-channel',
    tag: 'growth',
    title: 'Which growth channel gets the next two weeks?',
    bodyMd: `There is time to push one channel properly in the next two weeks. The options:

- **LinkedIn-sourced student lists:** direct outreach to students preparing for placements.
- **Swoop:** listing and outreach through Swoop.
- **Signal & Ship:** the build-in-public log on X/Twitter.
- **Mock Interview YouTube channel:** walkthroughs of real practice interviews.

The **Reach by channel** board will show what each one brings in (its rows are examples for now). Which channel deserves the focus, and how should the result be measured fairly?`,
  },
];

const PRICING_NOTE = 'Cost: see provider pricing page.';

export const SEED_RESOURCES: Array<{
  seedKey: string;
  name: string;
  kind: ResourceKind;
  url: string | null;
  usedFor: string;
  notes: string;
}> = [
  {
    seedKey: 'seed:resource:claude-opus',
    name: 'Claude Opus 5.1',
    kind: 'model',
    url: 'https://www.anthropic.com/claude',
    usedFor: 'Deep reasoning tasks: building interview question sets and reviewing difficult scoring cases.',
    notes: `Commercial API under Anthropic's terms. ${PRICING_NOTE} Rate limits depend on the account tier.`,
  },
  {
    seedKey: 'seed:resource:claude-sonnet',
    name: 'Claude Sonnet 5',
    kind: 'model',
    url: 'https://www.anthropic.com/claude',
    usedFor: 'Live interview turns, follow-up questions and the scoring report; also the lab "Ask Claude" button.',
    notes: `Commercial API under Anthropic's terms. ${PRICING_NOTE} Rate limits depend on the account tier.`,
  },
  {
    seedKey: 'seed:resource:azure-stt',
    name: 'Azure Speech-to-Text (free tier)',
    kind: 'service',
    url: 'https://azure.microsoft.com/products/ai-services/speech-to-text',
    usedFor: "Transcribing the candidate's spoken answers during an interview.",
    notes: `Free tier has a monthly usage allowance; check the Azure page for current limits. ${PRICING_NOTE}`,
  },
  {
    seedKey: 'seed:resource:azure-voice',
    name: 'Azure AI voice',
    kind: 'service',
    url: 'https://azure.microsoft.com/products/ai-services/text-to-speech',
    usedFor: "The interviewer's spoken voice.",
    notes: `Usage-based billing. ${PRICING_NOTE}`,
  },
  {
    seedKey: 'seed:resource:vercel',
    name: 'Vercel',
    kind: 'platform',
    url: 'https://vercel.com',
    usedFor: 'Hosting the MockInterview app and these two sites.',
    notes: `Plan limits apply to functions and bandwidth. ${PRICING_NOTE}`,
  },
  {
    seedKey: 'seed:resource:kaggle-notebooks',
    name: 'Kaggle notebooks',
    kind: 'tool',
    url: 'https://www.kaggle.com/code',
    usedFor: 'Offline experiments, such as checking scoring stability across repeated runs.',
    notes: 'Free notebooks with session and accelerator quotas; check the current quota page.',
  },
  {
    seedKey: 'seed:resource:swoop',
    name: 'Swoop',
    kind: 'channel',
    url: null,
    usedFor: 'Reaching students preparing for placements.',
    notes: 'Acquisition channel. Track candidates started on the Reach by channel board.',
  },
  {
    seedKey: 'seed:resource:linkedin-lists',
    name: 'LinkedIn-sourced student lists',
    kind: 'dataset',
    url: null,
    usedFor: 'Direct outreach to students preparing for campus placements.',
    notes: 'Handle personal data with consent and follow LinkedIn terms of use. Not for public sharing.',
  },
  {
    seedKey: 'seed:resource:signal-ship',
    name: 'Signal & Ship Twitter build log',
    kind: 'channel',
    url: null,
    usedFor: 'Building in public on X/Twitter and bringing in early users.',
    notes: 'Organic channel. Track candidates started on the Reach by channel board.',
  },
  {
    seedKey: 'seed:resource:youtube',
    name: 'Mock Interview YouTube channel',
    kind: 'channel',
    url: null,
    usedFor: 'Walkthroughs of practice interviews that send students to the app.',
    notes: 'Organic channel. Track candidates started on the Reach by channel board.',
  },
];
