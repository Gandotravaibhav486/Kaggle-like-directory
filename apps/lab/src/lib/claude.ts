import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  agentReplyModelSchema,
  agentReplyPayloadSchema,
  buildObservationMessages,
  type AgentReplyPayload,
  type BriefingInput,
} from '@mi/db/domain';

export type ClaudeResult =
  | { configured: false }
  | { configured: true; ok: true; replyId: string; mock: boolean }
  | { configured: true; ok: false; error: string };

export function claudeStatus(): { configured: boolean; mock: boolean; model: string } {
  const mock = process.env.MOCK_CLAUDE === '1';
  const configured = mock || Boolean(process.env.ANTHROPIC_API_KEY);
  return { configured, mock, model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5' };
}

const MOCK_PAYLOAD: AgentReplyPayload = {
  observations: [
    '[Mock response] The thread raises a measurement question with no agreed method yet.',
    'Several replies ask for a concrete test before changing anything else.',
  ],
  suggestions: [
    {
      suggestion: 'Agree on one repeatable test before comparing any two approaches.',
      reason: 'Without a fixed test, improvements cannot be told apart from noise.',
    },
  ],
  biggestRisk: 'Deciding a fix works before the measurement itself is trustworthy.',
  missingInformation: ['A real measurement run is needed; no metrics are invented here.'],
};

export async function generateObservations(
  input: BriefingInput,
): Promise<{ payload: AgentReplyPayload; model: string; mock: boolean }> {
  const status = claudeStatus();
  if (status.mock) {
    return { payload: MOCK_PAYLOAD, model: 'mock', mock: true };
  }

  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  const { system, user } = buildObservationMessages(input);
  const model = status.model;

  const res = await client.messages.parse({
    model,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: 'medium', format: zodOutputFormat(agentReplyModelSchema) },
  });

  if (res.stop_reason === 'refusal' || !res.parsed_output) {
    throw new Error('Claude did not return a usable answer.');
  }
  const payload = agentReplyPayloadSchema.parse(res.parsed_output);
  return { payload, model, mock: false };
}
