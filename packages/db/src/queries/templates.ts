import type { PageKind } from '../domain/types';

/** Starter markdown for pages of a brand-new season (no numbers, no invented metrics). */
export function templatePageBody(kind: PageKind, title: string): string {
  switch (kind) {
    case 'overview':
      return `## ${title}\n\nWhat this season is about, in two or three sentences.\n\n### Goal\n\nThe one outcome that would make this season a success.\n\n### What is tracked\n\n- The leaderboards for this season\n- The private ledger (only shared months appear publicly)\n- Discussion in the lab\n`;
    case 'description':
      return `## What is being built\n\nDescribe the product state at the start of the season and what changes during it.\n\n## Who it is for\n\nDescribe the users and buyers this season focuses on.\n`;
    case 'evaluation':
      return `## How progress is judged\n\nExplain each leaderboard: what is measured, the unit, and whether higher or lower is better.\n\nEntries are only ranked when they have a date and a source note.\n`;
    case 'rules':
      return `## Rules\n\n1. Never invent metrics. Placeholder numbers are flagged as examples.\n2. Every leaderboard entry needs a date and a source note.\n3. Ledger months are private unless explicitly shared.\n`;
    case 'timeline':
      return `## Timeline\n\n- **Start:** the season start date\n- **Midpoint review:** what gets checked halfway\n- **End:** the season end date and the wrap-up\n`;
  }
}

export const LEDGER_BOARD_TEMPLATE = {
  slug: 'monthly-revenue',
  title: 'Monthly revenue',
  objective: 'Revenue collected per month, from months the owner has shared publicly in the ledger.',
  direction: 'higher' as const,
  target: null,
  period: 'per month',
  source: 'ledger_revenue' as const,
  decimals: 2,
};
