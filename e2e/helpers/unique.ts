/** Unique, slug-safe identifier: `${prefix}-${time}${random}` (lowercase, digits, hyphens). */
export function uniq(prefix: string): string {
  const clean = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = Math.random().toString(36).slice(2, 7);
  return `${clean || 'x'}-${Date.now().toString(36)}${rand}`;
}
