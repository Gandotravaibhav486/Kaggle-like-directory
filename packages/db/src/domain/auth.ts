/** True only when both emails are non-empty and equal after trim + lowercase. */
export function isOwnerEmail(
  email: string | null | undefined,
  ownerEmail: string | null | undefined = typeof process !== 'undefined' ? process.env.OWNER_EMAIL : undefined,
): boolean {
  const a = (email ?? '').trim().toLowerCase();
  const b = (ownerEmail ?? '').trim().toLowerCase();
  return a !== '' && b !== '' && a === b;
}
