// TODO: switch these to `import type { AgentReplyPayload, ActionResult } from '@mi/db/domain'`
// once @mi/db is published by Worker A. Kept here as local copies (matching
// ARCHITECTURE.md §4.1 exactly) so @mi/ui type-checks standalone.

export interface AgentReplyPayload {
  observations: string[];
  suggestions: Array<{ suggestion: string; reason: string }>;
  biggestRisk: string;
  missingInformation: string[];
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> };
