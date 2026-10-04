import { describe, expect, it } from 'vitest';
import { generateAgentToken, hashAgentToken } from '../src/domain/tokens';
import { isOwnerEmail } from '../src/domain/auth';

describe('agent tokens', () => {
  it('has the mi_agt_ format with 32 random bytes in base64url', () => {
    const t = generateAgentToken();
    expect(t.plaintext).toMatch(/^mi_agt_[A-Za-z0-9_-]{43}$/);
    expect(t.prefix).toBe(t.plaintext.slice(0, 12));
    expect(t.prefix).toHaveLength(12);
  });
  it('hashes deterministically with sha256 hex', () => {
    const t = generateAgentToken();
    expect(t.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashAgentToken(t.plaintext)).toBe(t.hash);
    expect(hashAgentToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('generates unique tokens', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateAgentToken().plaintext));
    expect(set.size).toBe(50);
  });
});

describe('isOwnerEmail', () => {
  it('compares trimmed, lowercased emails', () => {
    expect(isOwnerEmail(' Owner@Example.com ', 'owner@example.com')).toBe(true);
    expect(isOwnerEmail('someone@example.com', 'owner@example.com')).toBe(false);
  });
  it('is false when either side is empty', () => {
    expect(isOwnerEmail('', '')).toBe(false);
    expect(isOwnerEmail(null, 'owner@example.com')).toBe(false);
    expect(isOwnerEmail('owner@example.com', '')).toBe(false);
    expect(isOwnerEmail('owner@example.com', undefined)).toBe(false);
  });
});
