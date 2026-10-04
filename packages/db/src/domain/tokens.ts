import { createHash, randomBytes } from 'node:crypto';

export const AGENT_TOKEN_PREFIX = 'mi_agt_';

/** plaintext = 'mi_agt_' + base64url(32 random bytes); hash = sha256 hex; prefix = first 12 chars. */
export function generateAgentToken(): { plaintext: string; hash: string; prefix: string } {
  const plaintext = AGENT_TOKEN_PREFIX + randomBytes(32).toString('base64url');
  return { plaintext, hash: hashAgentToken(plaintext), prefix: plaintext.slice(0, 12) };
}

export function hashAgentToken(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf8').digest('hex');
}
