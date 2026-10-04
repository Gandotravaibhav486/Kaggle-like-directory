import { z } from 'zod';
import { agentReplyPayloadSchema } from '@mi/db/domain';
import { authenticateAgentToken, consumeRateLimit, createAgentReply, getCompetitionById, getThread } from '@mi/db/queries';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 32 * 1024;

const bodySchema = z.object({
  threadId: z.string().min(1),
  agentName: z.string().trim().min(1).max(60).optional(),
  payload: agentReplyPayloadSchema,
});

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return json({ error: 'missing_token' }, { status: 401 });
  const plaintext = match[1]!.trim();

  const token = await authenticateAgentToken(db, plaintext);
  if (!token) return json({ error: 'invalid_token' }, { status: 401 });

  const rate = await consumeRateLimit(db, token.id);
  const headers: HeadersInit = {
    'X-RateLimit-Limit': String(token.rateLimit),
    'X-RateLimit-Remaining': String(rate.remaining),
  };
  if (!rate.allowed) {
    return json(
      { error: 'rate_limited' },
      { status: 429, headers: { ...headers, 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, { status: 413, headers });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, { status: 413, headers });

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ error: 'invalid_json' }, { status: 400, headers });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400, headers });
  }

  const thread = await getThread(db, parsed.data.threadId);
  if (!thread) return json({ error: 'not_found' }, { status: 404, headers });
  if (thread.competitionId !== token.competitionId) {
    return json({ error: 'wrong_competition' }, { status: 403, headers });
  }

  const reply = await createAgentReply(db, {
    threadId: thread.id,
    agentName: parsed.data.agentName ?? token.name,
    source: 'api',
    payload: parsed.data.payload,
    agentTokenId: token.id,
  });

  const competition = await getCompetitionById(db, thread.competitionId);
  return json(
    { id: reply.id, threadId: thread.id, url: `/competitions/${competition?.slug ?? thread.competitionId}/discussion/${thread.id}` },
    { status: 201, headers },
  );
}
