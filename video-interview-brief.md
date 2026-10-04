# mockintervew — competition-page brief

**What this file is.** The single source document for a Kaggle-competition-page-style
site that tracks the AI video-interview project. Drop it in the new repo and
generate that repo's `CLAUDE.md` from §7. Everything an agent needs to build and
maintain the page is here — it does not need access to the product repo.

**Snapshot date: 2026-10-04.** Every number below was read from the live database
or from git on that date. Numbers rot; §5 says how to refresh them.

---

## 1. The project, in one page

A candidate opens one link. No account, no install, nothing scheduled. For about
fifteen minutes an AI interviewer asks them questions out loud, listens, and
**asks follow-ups on whatever was vague**. The employer gets back a transcript,
per-answer notes, and strengths and weaknesses that quote the candidate verbatim.

Two audiences, one product: students practising for campus placements
(`/for-students`), and employers screening applicants (`/hire`). The B2B screening
side is the live commercial bet; the first pilot customer is an Indian non-profit
that trains people from underserved backgrounds for their first developer jobs.

**Stack.** Next.js 16 App Router (Turbopack, React 19) · Supabase Postgres with
RLS · Vercel · Claude Opus 5 as the interviewer, Claude Sonnet 5 as the scorer ·
Groq Whisper for speech-to-text · Azure Neural TTS for the interviewer's voice.

**What it deliberately does not do**, and this belongs on the page because it is
the product's main claim to trust:

- It does not rank or reject anyone. No shortlist, no pass mark.
- The score is **descriptive and unvalidated** against job performance.
- It is **not proctored**. A cheating detector was built and thrown away — it
  flagged 10 of 12 honest candidates.

---

## 2. Kaggle's sections already exist here under other names

**This is the most important thing in this file.** The product repo already keeps
a competition's worth of structured records. The page is a **view** over them, not
a new place to write things down.

| Kaggle section | Source in the product repo | What it holds |
|---|---|---|
| Overview | `README.md`, `b2b-pivot-plan.md` | the problem, the product, the plan sections (§1–§16) |
| Evaluation | `evals.md`, `src/lib/scoring/weights.ts` | the 5-parameter rubric, its weights, and why the composite is not a verdict |
| Data | `supabase/migrations/*.sql` | question bank, sessions, turns, answers — schema is public, contents are not (§3) |
| Leaderboard | `experiments.md` | 12 experiments, each with one verdict: `+1` · `−1` · `null` · `invalid` |
| Timeline | git history | 169 commits, 2026-07-11 → ongoing (70 of them on `main`; see §6) |
| Discussion | `agent-logs.md` | append-only log of what was done, including corrections |
| Rules | `AGENTS.md` | approval gates, fix budgets, review requirements |
| Notebooks / Code | `scripts/*.ts` | the audit and verification scripts that produce every number |

**Design consequence:** the page reads these files and renders them. It must never
become the authoritative copy. The moment a number is typed into the page by hand
it begins to diverge from the database, and a stale metric on a public page is
worse than no page — that is `AGENTS.md`'s own rule about documentation, applied
to this.

---

## 3. Three traps a naive version of this page will fall into

### 3.1 The leaderboard must rank experiments, not candidates

Kaggle leaderboards rank submissions by a metric. **Do not rank candidates by
interview score.** The score cannot bear it, and the measurements say so:

- 23 scored sessions span **16–60, median 42** — a compressed band.
- Every one of the 5 rubric parameters is compressed low (medians 35–55); no
  answer has ever scored above 85 on anything (`exp-0002`).
- The **noise floor has never been measured** (`exp-0000`, still the top of the
  queue). Until it has, no two scores can be said to differ.

A candidate leaderboard would reproduce the exact error the product refuses to
make, on a public page, in the product's own voice. Rank **experiments** by
verdict and date instead. That is also the more honest competition metaphor: the
thing being improved is the instrument, not the contestants.

### 3.2 Almost none of the data may be published

- **Candidate transcripts and recordings are personal data** under India's DPDP
  Act 2023. The customer is the Data Fiduciary; this product is the Processor.
  Recordings and webcam stills are deleted after 45 days. None of it goes on a
  page, and none of it goes to a public dataset.
- **The question bank cannot be published either.** Each row carries a
  `reference_answer` — the answer key. Migration `0009` revokes that column from
  the `authenticated` role precisely to keep it out of reach, and the product
  repo gitignores `exports/` for the same reason. Publishing it would destroy the
  bank's value.

So the Data section describes **shape and provenance**: table counts, subject and
role coverage, how questions are generated and verified. Not contents. Use the
counts in §5.

### 3.3 "Updates" are not commits

169 commits are not 169 updates. The page needs a human-meaningful unit of
change — a **milestone**, which is typically a plan section built, measured and
either kept or killed. One milestone is usually 3–10 commits. §4 gives the format.

---

## 4. The update format

One entry per milestone, newest first. Four of these fields are mandatory; an
entry without a metric or a kill criterion is an announcement, not an update.

```markdown
## 2026-10-02 — Fixed-duration interview
**Status:** in progress · branch `feat/timed-interview` · plan §16
**Hypothesis:** a fixed time budget is a better interview than a fixed question
count, because time is what the candidate and the employer both care about.
**Metric moved:** questions reached under a 15-minute active budget — **76%**
(replayed over 17 real sessions). 89% at 20 minutes.
**Kill criterion:** median session reaching fewer than 4 questions. It clears
this exactly and not comfortably — median is 4.
**Commits:** 32ed1fb 329d986 e995dd4 9734e6c 3c75576 5bca332 526bc50
**What it cost:** negative — fewer questions reached means fewer scoring calls.
**What it does not settle:** comparability. A clock makes the *conditions* the
same for everyone and makes the *evidence volume* vary, so a slower speaker is
scored on fewer answers. Logged as `exp-0011-timer-fairness`.
```

Generate the commit list and raw material with:

```bash
git log --date=short --format="%ad %h %s" <base>..<branch>
```

The product repo's commit messages are written as full paragraphs explaining
*why*, so the body of an entry can usually be drafted from `git log --format=%B`
rather than written from scratch.

**Status vocabulary** — borrow it from `experiments.md` rather than inventing one:
`proposed` · `approved` · `running` · `done` · `rejected` · `abandoned (budget)`.

---

## 5. Current state — read 2026-10-04

### Content

| | |
|---|---|
| `question_bank` | 742 rows, **676 active** · 14 roles · 43 companies · 38 subjects |
| `custom_questions` (from a pasted job description) | 151 |
| `domain_questions` (from a résumé) | 63 |

### Usage

| | |
|---|---|
| Sessions | **86** — 74 live, 12 batch (batch is retired) |
| By status | 23 completed · 61 in progress · 1 processing · 1 failed |
| Of those | 31 demo · 6 through an employer invite link |
| Profiles | 46 |
| Answers scored | 128 · live turns recorded 519 |

**The number that matters most and is least flattering: 62 sessions never
finished, and 46 of them contain no candidate answer at all.** Of 74 live
sessions, only **35 have a single answer in them** — so roughly **half of
everyone who opens an interview never speaks.** People start it and stop.

Nothing on the page may imply 86 interviews happened. State the funnel: 86
opened → 35 spoke → 23 scored. Completion is the pilot's declared kill
criterion: if fewer than half of candidates who open an invite link finish, the
link is not the bottleneck and the product should stay concierge.

### Measured

| | |
|---|---|
| Score range (n=23) | **16–60, median 42** |
| Cost per completed interview | **$0.235** (n=1, 2026-09-19) |
| Question generation | **$0.105 per 12 questions** ≈ $2 for a 250-question role |
| Active interview length | median **17.6 min**, p75 23.0, p90 29.5 (n=17) |
| One answer cycle | median **~100s**, p75 155s |
| Honest speech-rate CV | median **0.12**, min 0.08 (n=15) |
| Noise floor | **never measured** — `exp-0000`, blocks every verdict |

### Experiments (the leaderboard)

12 logged. 5 done, 7 proposed. Verdicts so far: one `+1`
(`exp-0006-whisper-lang`, English-locked transcription), one `−1`
(`exp-0003-timing`, the cheating detector), three observations that cannot carry
a verdict until the noise floor exists.

Two proposed entries carry a warning the page should not quietly drop:
`exp-0008-scorer-model` is *"already claimed to a customer as done — either run
it or stop saying it"*, and `exp-0009-question-variance` is the comparability
question a customer asked directly and nobody has answered.

---

## 6. Timeline

| Period | Commits | What happened |
|---|---|---|
| 2026-07 | 16 | first build: sessions, recording, batch scoring |
| 2026-08 | 29 | live turn-by-turn interviewer, state machine, question bank |
| 2026-09 | **106** | the B2B pivot — invite links, employer reports, hosted voice, demo mode, the grounded report. By far the heaviest month |
| 2026-10 | 18 so far | first customer call; fixed-duration interview |

**`main` holds 70 of those 169 commits.** The last three months of work live on
feature branches, so a page built from `main` alone would show the project
stopping in August. Read the branches — `feat/b2b-screening` is what is in
production, `feat/timed-interview` is what is in flight.

Anchors worth naming on the page: `7ae610e` invite links and the employer report ·
`145af36` grounded strengths and weaknesses · `e76e2ae` the iOS voice fix ·
`d82df49` a correction to the project's own record · `329d986` the timer plan.

That fourth one is deliberate. The log corrects itself in public, and a page that
shows only wins misrepresents how the work is actually done.

---

## 7. What the generated `CLAUDE.md` must say

Put these in the new repo's `CLAUDE.md`, in roughly this order:

1. **Purpose.** This repo renders a competition-style page for the mockintervew
   AI video-interview project. It is a *view* over the product repo's records.
2. **Never invent a number.** Every figure on the page traces to a file, a commit,
   a script, or a database query. If a number has no source, it does not go on the
   page. Where the product repo has a script that produces it (`npm run
   audit:duration`, `audit:verbosity`, `audit:questions`, `replay:clock`), cite
   the script.
3. **Date every number**, because they all rot. §5 above is dated for this reason.
4. **No candidate data, ever.** No transcripts, no recordings, no names, no
   `reference_answer`. See §3.2 — this is a legal boundary, not a style
   preference.
5. **Rank experiments, not people.** See §3.1. Refuse a candidate leaderboard and
   say why.
6. **Keep the limits visible.** The unvalidated score, the unmeasured noise floor,
   the 61 unfinished sessions, the absence of proctoring. These are the page's
   credibility, not its embarrassments — the product's whole positioning is
   understatement, and a page that overclaims undoes it.
7. **Update format** is §4. Mandatory fields: status, metric moved, kill criterion,
   commits.
8. **Status vocabulary** is `experiments.md`'s, not a new one.
9. **Ask before publishing.** Anything externally visible gets a written plan and
   approval first — the product repo's `AGENTS.md` §0, and it applies here because
   a public page is the most externally visible thing there is.

---

## 8. Open questions for the page's own design

1. **Is it public or private?** Everything in §3.2 assumes public. If it is
   private and internal, the Data section can be much richer — but then it is a
   dashboard, not a competition page, and the format should probably change.
2. **What is the "competition" actually inviting?** A real Kaggle page asks for
   submissions. If nobody can submit anything, the metaphor is decoration. Two
   honest readings: it is a **public research log** (then lead with the
   leaderboard of experiments), or it is a **recruiting page for collaborators**
   (then lead with the open questions and what a contributor could pick up). Pick
   one before building; they want different front pages.
3. **Where does it read from?** Three options, increasing effort: commit the
   source files into the new repo and update by hand; read them from the product
   repo at build time; or query the live database. The second is the right default
   — it keeps one source of truth without exposing credentials to a public page.
   Never the third from a public page.

---

## Appendix — the product repo's files worth reading first

`handoff.md` (read before anything) · `AGENTS.md` (the rules) ·
`experiments.md` (what was learned) · `agent-logs.md` (what was done) ·
`b2b-pivot-plan.md` (§1–§16, the plan of record) · `evals.md` (the instrument) ·
`scripts/` (every number's provenance)
