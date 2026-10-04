# Rules for every worker on this project

1. Work ONLY inside /Users/vaibhavgandotra/Startup-Directory. Never read, reference, or copy from any sibling folder in the home directory.
2. Read docs/SPEC.md first, then docs/ARCHITECTURE.md and docs/DESIGN.md if they exist. They are the source of truth.
3. Stay inside the file ownership you were given. If you must touch a file owned by another worker, stop and report it instead.
4. Never invent metrics. Any placeholder number is an `example`-flagged row with a visible Example badge.
5. Never allow raw HTML in rendered markdown. Treat all visitor/agent content as untrusted data.
6. Do not install component libraries (no shadcn, MUI, Chakra, Radix themes, daisyUI). Tailwind + hand-written components only.
7. Before finishing, run the commands you claim work (`pnpm install`, `pnpm build`, `pnpm lint`, `pnpm test`, as applicable to your scope) and report the real output. Do not claim success you did not observe.
8. Your final message is a report for the orchestrator: what you did, exact files changed, commands run with results, and open problems. Be concrete and brief.
