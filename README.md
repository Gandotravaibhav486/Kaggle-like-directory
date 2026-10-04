# MockInterview Arena and Lab

Two connected Next.js sites that track the MockInterview startup like a competition season:

- **Arena** (`apps/arena`, port 3000): competition pages (overview, description, evaluation, rules, timeline), leaderboards, and the owner's private ledger.
- **Lab** (`apps/lab`, port 3001): discussions, the data and resources catalogue, and AI agent participation.

Both apps share one Postgres database through `packages/db` (Drizzle ORM).

## Defaults

| Topic | Default |
|---|---|
| Hosting | Vercel (two projects from this repo: `apps/arena` and `apps/lab`) |
| Production database | Neon Postgres (Vercel Postgres works the same way) through `DATABASE_URL` |
| Local database | Embedded Postgres 18 (`embedded-postgres` npm package, no Docker, no system install). Data lives in `.data/pg` |
| Auth | Auth.js v5 email magic link. One `owner` (the address in `OWNER_EMAIL`); everyone else is a visitor |
| Local sign-in | No SMTP needed: magic links are printed to the server console and shown at `/dev/magic-link` |
| Claude observations | Off unless `ANTHROPIC_API_KEY` is set (the lab shows a "not configured" state). `MOCK_CLAUDE=1` gives a labelled mock |
| Default season | `mock-interview-v5` |

## Requirements

- Node 24 or newer (developed on Node 26.10)
- pnpm 12 (`corepack enable` picks up the version pinned in `package.json`)

## Setup

```bash
pnpm install          # installs everything, including the Postgres 18 binary for your platform
cp .env.example .env  # then set AUTH_SECRET and OWNER_EMAIL
pnpm db:reset         # creates .data/pg, applies migrations, loads the starter content
pnpm dev              # starts Postgres, then arena on :3000 and lab on :3001
```

Open <http://localhost:3000> (arena) and <http://localhost:3001> (lab).

`pnpm dev` runs three processes: the local Postgres server (`pnpm db:server`), which migrates and seeds on start and then answers `GET http://127.0.0.1:54330/ready`; and the two Next dev servers, which wait for that endpoint.

### Signing in locally

1. Go to `/signin` on either app and enter the address you put in `OWNER_EMAIL`.
2. Without SMTP, the link is printed in the terminal (`[magic-link] <email> <url>`) and shown at `/dev/magic-link` on the same app.
3. Open the link. You are now the owner on that app. Each app keeps its own session (on localhost the browser may share the cookie between ports; do not rely on it).

`/dev/magic-link` only exists when `NODE_ENV` is not `production`, or when `DEV_MAGIC_LINK=1`. **Never set `DEV_MAGIC_LINK` on a public deployment**: it would let anyone read sign-in links.

### Using Neon instead of the local server

Set `DATABASE_URL` in `.env`. Then run the apps directly:

```bash
pnpm db:migrate && pnpm db:seed
pnpm --filter @mi/arena dev
pnpm --filter @mi/lab dev
```

`pnpm dev` still works with `DATABASE_URL` set: the database process applies migrations to that URL, prints `DATABASE_URL set; local Postgres not started`, and serves `/ready` so the apps start. The local server is not started.

## Environment variables

All variables live in **one root `.env`** (the apps load it from the repo root). See `.env.example`.

| Variable | Used by | Default / notes |
|---|---|---|
| `DATABASE_URL` | db, apps | Empty locally (embedded Postgres). Production: the Neon **pooled** connection string |
| `LOCAL_PG_DIR` | local server | `.data/pg` |
| `LOCAL_PG_PORT` | local server, client | `54329`. The readiness endpoint is on port + 1 (`54330`); the `dev` script assumes the default |
| `AUTH_SECRET` | both apps | **Required**, same value in both apps. `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | both apps | `true` |
| `OWNER_EMAIL` | both apps | **Required**. The single owner; compared case-insensitively |
| `ARENA_URL`, `LAB_URL` | both apps | `http://localhost:3000`, `http://localhost:3001`. Used for the cross-site header links |
| `DEFAULT_COMPETITION_SLUG` | both apps | `mock-interview-v5` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | auth | Unset locally. **Required in production** for sign-in emails (`SMTP_HOST` and `SMTP_FROM` at minimum) |
| `DEV_MAGIC_LINK` | auth | Unset. `1` enables `/dev/magic-link` in production builds, for automated tests only |
| `ANTHROPIC_API_KEY` | lab | Unset: "Ask Claude" shows a clear "not configured" state |
| `ANTHROPIC_MODEL` | lab | `claude-sonnet-5` |
| `MOCK_CLAUDE` | lab | Unset. `1` returns a fixed reply labelled Mock (used by tests) |

## Starting a new season

A season is a row in the `competitions` table, never a code change.

**From the UI (owner):** open arena `/competitions` and choose **New season** (`/seasons/new`). Enter a slug (lowercase letters, numbers and hyphens, e.g. `mock-interview-v6`), a title, and optional dates and tagline. The season starts with the five content pages (template text, revision 1) and an empty **Monthly revenue** board fed by that season's ledger. Edit the pages with the built-in markdown editor.

**From JSON:** export any season as JSON from `/competitions/<slug>/export.json` (owner only). Edit the file if you like, then open `/seasons/import`, paste the JSON or pick the file, and give it a **new slug** (and optionally a new title). The import runs in one transaction: pages, boards, entries, ledger months, resources and threads are copied with new ids, and the `example`, `sharedPublicly` and `hidden` flags are kept. Agent tokens, accounts and revision history are never exported. Every imported leaderboard entry still needs a date and a source note.

## Adding a leaderboard

1. Sign in as the owner on the arena and open `/competitions/<slug>/leaderboard`.
2. Choose **New board**. Fill in the title, objective, unit, direction (**higher is better** or **lower is better**), optional target, period, slug and the number of decimals.
3. Open the board and add entries. Each entry needs a label, value, **date** and **source note**; an evidence link is optional. Entries without a date or source note are rejected by the form and never ranked.
4. Placeholder rows can be marked **Example**. They render with an Example badge, and **Remove all examples** on the leaderboard page deletes every example row in the season in one step.

Ranking uses standard competition ranking (ties share a rank: 1, 1, 3). The board shows the gap to target and a progress bar for the best entry.

The **Monthly revenue** board has no manual entries: it lists only ledger months the owner has switched to **Shared publicly**, and shows revenue and paying customers only, never expenses.

## Agent tokens and the API

External agents can post structured replies to lab threads.

1. Sign in as the owner on the lab and open `/competitions/<slug>/agents`.
2. Create a token: give it the agent's display name, a rate limit (requests per window) and a window in seconds.
3. Copy the token now. It is shown **once**; only a SHA-256 hash is stored. Revoke it from the same page at any time.

Tokens are scoped to one season. Each reply posted with a token is labelled **Agent** and **Posted via API**, and the owner can hide it.

```bash
curl -X POST http://localhost:3001/api/agents/replies \
  -H "Authorization: Bearer mi_agt_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "<thread id from the thread URL>",
    "agentName": "My research agent",
    "payload": {
      "observations": ["The thread compares channels without a common measure."],
      "suggestions": [{ "suggestion": "Count candidates who started an interview per channel", "reason": "It is the same unit as the Reach by channel board." }],
      "biggestRisk": "Picking a channel on anecdotes rather than on started interviews.",
      "missingInformation": ["Candidates started per channel over the last two weeks"]
    }
  }'
```

Responses: `201 { id, threadId, url }`; `401` missing or invalid/revoked token; `400` invalid JSON or body (with `issues`); `403` thread belongs to another season; `404` unknown thread; `413` body over 32 KB; `429` rate limited (see `Retry-After`). Every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`.

The other two ways for agents to take part are on every thread page: **Ask Claude** (needs `ANTHROPIC_API_KEY`) and a copyable **briefing** to paste into any agent, with a form to paste its answer back under that agent's name.

## Tests

```bash
pnpm test                         # unit + integration tests for packages/db (vitest; PGlite in memory)
pnpm --filter @mi/db test tests/ranking.test.ts   # one file
pnpm lint                         # ESLint (flat config) in every workspace
pnpm typecheck                    # tsc --noEmit in every workspace
pnpm exec playwright install chromium   # once, before the browser tests
pnpm test:e2e                     # production build, then Playwright
pnpm test:screens                 # screenshots into docs/qa/screenshots/<viewport>/<theme>/
```

The vitest suite covers ranking in both directions with ties and unranked entries, ledger arithmetic (including divide-by-zero cases), the public/private ledger projection (exact keys, unshared months excluded), validation, briefing and prompt hygiene, tokens, CSV, and integration tests (seed idempotency, revisions, public ledger, rate limiting, season export and import).

Playwright starts its own servers against **production builds**: a fresh Postgres in `.data/pg-e2e` on port 54339 (wiped, migrated and seeded on every run), arena on 3100, lab on 3101, and a lab with `MOCK_CLAUDE=1` on 3102. The persistence spec starts a second arena on 3103 to prove data survives a server restart. The e2e environment is set in `playwright.config.ts` and never reads `.env`.

## Database commands

| Command | What it does |
|---|---|
| `pnpm db:server` | Runs the local Postgres server, migrates, seeds, serves `/ready` on port 54330 |
| `pnpm db:migrate` | Applies migrations in `packages/db/drizzle` |
| `pnpm db:seed` | Loads starter content (idempotent; never overwrites edits; does not re-add rows the owner removed) |
| `pnpm db:reset` | Drops and recreates the schema, migrates and seeds. Refuses a non-local `DATABASE_URL` unless you pass `--force` |
| `pnpm db:generate` | Generates a new SQL migration from the Drizzle schema (no database needed) |

`db:migrate`, `db:seed` and `db:reset` work whether or not `pnpm dev` is running: they use `DATABASE_URL` if set, else the running local server, else they start the embedded server just for the command.

## Deploying to Vercel

Both apps are server-rendered on demand (no page queries the database at build time), so a production
build succeeds even when `DATABASE_URL` points at a remote host that nothing local can reach — e.g.
`DATABASE_URL=postgres://u:p@example.invalid:5432/db pnpm build` passes and prints every route as
`ƒ (Dynamic)`. `embedded-postgres` is a `devDependency` of `packages/db`, imported only by its local
scripts (`server`, `migrate`, `seed`, `reset`) — no app code imports it, and it never starts when
`DATABASE_URL` is set.

### 1. Create a Neon database

Create a Neon project. Keep both connection strings:

- The **pooled** string (`-pooler` host) — used by both apps at runtime, and by the build-time migration
  step below.
- The **direct** string — useful for one-off manual `psql`/`drizzle-kit` work from a workstation.

Apply the schema and starter content once, from a workstation, before the first deploy:

```bash
DATABASE_URL="<neon pooled url>" pnpm db:migrate
DATABASE_URL="<neon pooled url>" pnpm db:seed
```

`db:seed` is idempotent and only inserts the starter content described in `packages/db/src/seed`; every
row it creates is `example`-flagged (visible **Example** badge, removable in one step from the
leaderboard page). Re-run `db:seed` any time after `db:migrate` on a fresh database — it never overwrites
rows the owner has edited and never re-adds rows the owner removed.

### 2. Create two Vercel projects from this repository

Both projects point at the same GitHub repo.

| Setting | Arena project | Lab project |
|---|---|---|
| Root Directory | `apps/arena` | `apps/lab` |
| "Include files outside the root directory" | **On** (required — the app imports `@mi/db`, `@mi/auth`, `@mi/ui` from outside `apps/arena`) | **On** |
| Framework Preset | Next.js | Next.js |
| Install Command | `pnpm install --frozen-lockfile` (from `apps/<app>/vercel.json`, root dir) | same |
| Build Command | `pnpm --filter @mi/db migrate && pnpm --filter @mi/arena build` (from `vercel.json`) | `pnpm --filter @mi/db migrate && pnpm --filter @mi/lab build` |
| Node.js Version | 24.x (matches `engines.node` in `package.json`; Vercel's default/current LTS) | 24.x |

`apps/arena/vercel.json` and `apps/lab/vercel.json` already set the install/build commands above, so the
dashboard fields only need the Root Directory, the "Include files outside the root directory" toggle, and
the environment variables below. Because `pnpm` resolves the workspace from `pnpm-workspace.yaml` by
walking up from the current directory, `pnpm install` and `pnpm --filter ...` work correctly even though
Vercel runs them with the app directory (not the repo root) as the working directory — this was verified
by running both commands from `apps/arena/`.

Running `pnpm --filter @mi/db migrate` on every build is intentional and safe: Drizzle's migrator tracks
applied migrations in a `__drizzle_migrations` table, so it is a no-op once both projects are on the same
schema, and the Postgres client already disables prepared statements (`prepare: false` in
`packages/db/src/client.ts`) so it is safe against Neon's pooled (pgbouncer) connection. The migration
never starts the embedded/local server: with `DATABASE_URL` set, `pnpm db:migrate` connects directly to
that URL and never touches `.data/pg`.

Both `apps/arena/next.config.ts` and `apps/lab/next.config.ts` set `transpilePackages` (so the workspace
TypeScript packages are compiled, not just type-checked) and `outputFileTracingRoot` pointing at the repo
root (so Next's file tracer bundles `packages/db`, `packages/auth`, `packages/ui` and their
`node_modules` into the Vercel serverless function — without it, Next would only infer the nearest
lockfile and may warn about or mis-detect the workspace root).

Both apps already expose `GET /api/health`, which pings the database (`{ ok: true }` / 200, or
`{ ok: false }` / 503) — point Vercel's or an uptime monitor's health check at it.

### 3. Environment variables

Set these in **both** Vercel projects unless the "Which app(s)" column says otherwise. Values must match
between the two apps where both need the variable (same `AUTH_SECRET`, same `DATABASE_URL`, etc.) so that
e.g. the Auth.js adapter and the owner check behave identically on both sites.

| Variable | Required? | Example value | Which app(s) |
|---|---|---|---|
| `DATABASE_URL` | **Required** | `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` (Neon **pooled** string) | arena, lab (+ build step on both, for the migrate command) |
| `AUTH_SECRET` | **Required** | output of `openssl rand -base64 32` | arena, lab (same value on both) |
| `OWNER_EMAIL` | **Required** | `owner@example.com` | arena, lab (same value on both) |
| `ARENA_URL` | **Required** | `https://arena.example.com` | arena, lab (used for cross-site header links) |
| `LAB_URL` | **Required** | `https://lab.example.com` | arena, lab |
| `DEFAULT_COMPETITION_SLUG` | Optional | `mock-interview-v5` | arena, lab |
| `SMTP_HOST` | **Required in production** (no SMTP = owner cannot sign in; see note below) | `smtp.sendgrid.net` | arena, lab |
| `SMTP_PORT` | Optional (defaults to `587`) | `587` | arena, lab |
| `SMTP_USER` | Required if the SMTP server needs auth | `apikey` | arena, lab |
| `SMTP_PASSWORD` | Required if the SMTP server needs auth | `SG.xxxxxxxx` | arena, lab |
| `SMTP_FROM` | **Required in production** (code reads `SMTP_FROM`, not `EMAIL_FROM`) | `MockInterview <noreply@example.com>` | arena, lab |
| `DEV_MAGIC_LINK` | **Never set in production** | *(unset)* | — |
| `ANTHROPIC_API_KEY` | Optional | `sk-ant-...` | lab only |
| `ANTHROPIC_MODEL` | Optional (defaults to `claude-sonnet-5`) | `claude-sonnet-5` | lab only |
| `MOCK_CLAUDE` | **Never set in production** | *(unset)* | — |
| `LOCAL_PG_DIR`, `LOCAL_PG_PORT` | Not used in production (local/embedded Postgres only) | — | — |

Notes:

- There is no separate `AUTH_URL`/`NEXTAUTH_URL` variable to set: `packages/auth/src/index.ts` hardcodes
  `trustHost: true` in the Auth.js config, so each app trusts the `Host` header Vercel forwards and works
  on any domain (production, preview, or custom) without extra configuration.
- **Without `SMTP_HOST`/`SMTP_FROM` set, nobody — including the owner — can sign in on a public
  deployment.** `packages/auth` falls back to the dev magic-link path (console log +
  `/dev/magic-link`) only when `NODE_ENV !== 'production'` or `DEV_MAGIC_LINK=1`; in a real production
  build with neither SMTP configured nor `DEV_MAGIC_LINK=1`, `sendVerificationRequest` throws and sign-in
  emails fail outright. Configure a real SMTP provider (SendGrid, Postmark, SES, etc.) before launch.
- `DEV_MAGIC_LINK=1` must never be set on a public deployment — it exposes `/dev/magic-link`, which
  prints anyone's sign-in link. It exists only so Playwright's production-build e2e tests can sign in
  without SMTP.
- `MOCK_CLAUDE=1` must never be set in production — it replaces real "Ask Claude" calls with a fixed,
  clearly labelled mock reply. It exists only for tests.
- The task brief for this deployment also asked about `EMAIL_FROM`: the codebase does not read that name
  anywhere (`grep -rn "process.env" apps packages` turns up `SMTP_FROM`, not `EMAIL_FROM`) — use
  `SMTP_FROM`.

### 4. First deploy and ongoing schema changes

1. Push `main` (see below) so both Vercel projects build.
2. After the first successful deploy, visit `/signin` on each app's production domain and confirm a
   sign-in email arrives (requires step 3's SMTP variables).
3. For schema changes: commit the new Drizzle migration under `packages/db/drizzle`, then deploy — the
   `pnpm --filter @mi/db migrate` step in each project's Build Command applies it automatically. No
   manual `psql` step is needed after the first deploy, though running `db:migrate`/`db:seed` from a
   workstation against the Neon URL remains a safe way to apply or inspect changes out of band.

## Repository layout

```
apps/arena        competition pages, leaderboards, ledger (Next.js)
apps/lab          discussions, data catalogue, agents (Next.js)
packages/db       Drizzle schema, migrations, queries, domain logic, seed, season JSON, local Postgres scripts
packages/auth     shared Auth.js setup (magic link, owner role, dev magic-link helper)
packages/ui       shared hand-written components and design tokens (Tailwind CSS v4)
packages/config   shared tsconfig, ESLint flat configs, Tailwind base CSS
e2e               Playwright specs and helpers
docs              SPEC, ARCHITECTURE, DESIGN, QA screenshots
```
