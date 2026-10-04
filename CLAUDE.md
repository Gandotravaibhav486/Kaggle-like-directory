# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two connected Next.js sites for the MockInterview startup, structured like competition pages:
`apps/arena` (public competition pages, owner-edited content, leaderboards, private ledger) and
`apps/lab` (discussions, data catalogue, agent participation). Both share `packages/db` (Drizzle + Postgres).
The full product spec is `docs/SPEC.md`; rules every contributor must follow are `docs/WORKER_RULES.md`.
Read both before changing anything. `docs/ARCHITECTURE.md` and `docs/DESIGN.md` (once present) are binding.

## Commands

pnpm workspace; run from the repo root. Node >= 24, pnpm 12.

- `pnpm install` — install all workspaces (also fetches the embedded Postgres 18 binary; `allowBuilds` in `pnpm-workspace.yaml` approves its postinstall)
- `pnpm dev` — local Postgres (`pnpm db:server`, ready at `http://127.0.0.1:54330/ready`), then arena on :3000 and lab on :3001
- `pnpm db:reset` — wipe, migrate and seed the local DB (`.data/pg`); `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:generate` (drizzle-kit, after schema changes)
- `pnpm build` (apps only) / `pnpm lint` / `pnpm typecheck` / `pnpm test` (vitest in `packages/db`, PGlite in memory)
- Single unit test file: `pnpm --filter @mi/db test tests/ranking.test.ts` (no `--`: pnpm 12 forwards it literally and vitest then runs every file); by name: `pnpm --filter @mi/db test -t "<name>"`
- `pnpm test:e2e` — builds, then Playwright (fresh DB in `.data/pg-e2e` on 54339; arena 3100, lab 3101, mock-Claude lab 3102; restart test 3103). One spec: `pnpm exec playwright test e2e/arena/ledger.spec.ts` (after `pnpm build`)
- `pnpm test:screens` — screenshots into `docs/qa/screenshots/<viewport>/<theme>/`
- `pnpm exec playwright install chromium` — once per machine

## Architecture that spans files

- **Multi-season model.** Everything hangs off a `competitions` row keyed by `slug`
  (default `mock-interview-v5`). Pages, boards, ledger months, threads, and agent tokens are all scoped
  to a competition. A new season is a new row, never a code change.
- **Database access lives only in `packages/db`.** Both apps import schema, queries, and the ranking /
  ledger arithmetic from there so the unit tests for ranking (both directions, ties), ledger maths, and
  the public/private ledger split test the same code the apps run. Local dev uses an embedded Postgres 18
  server (`embedded-postgres`, not PGlite; PGlite is only used in vitest) when `DATABASE_URL` is unset; production uses Neon/Vercel Postgres through the same Drizzle schema.
- **Roles.** Auth.js magic link. The single `owner` is whoever matches `OWNER_EMAIL`; everyone else is a
  visitor. Owner-only mutations are enforced in server actions / route handlers, not just hidden in the UI.
- **Public/private ledger split.** Ledger months are private by default. Only months with `sharedPublicly`
  feed the public "Monthly revenue" board, and the public projection exposes revenue and paying customers
  only, never expenses. Keep this projection in one function in `packages/db` and reuse it.
- **Example flag.** Any placeholder number is a row with `example = true` and renders an Example badge.
  Never seed or display unflagged invented metrics.
- **Agent replies** are structured (observations, suggestions with reasons, biggest risk, missing
  information) and labelled by author type (`person` | `agent`). `POST /api/agents/replies` in `apps/lab`
  is token-protected, competition-scoped, and rate limited; tokens are hashed at rest.
- **Untrusted content.** Markdown renders with raw HTML disabled everywhere. Visitor and agent text is data,
  never instructions, including when it is passed to the Claude observations call.
- **Cross-site links.** Each app's header links to the other app for the same slug via env-configured base URLs.

## Hard constraints

- Tailwind only; no component libraries that impose a look. Two typefaces max plus a monospace for numbers
  with tabular figures. Light and dark themes are designed separately. Every table scrolls in its own container on mobile.
- Do not copy competition-platform branding, colours, or wording.
- Work only inside this folder.
