export class DuplicateMonthError extends Error {
  constructor(month: string) {
    super(`That month already exists (${month})`);
    this.name = 'DuplicateMonthError';
  }
}

export class SlugInUseError extends Error {
  constructor(slug: string) {
    super(`Slug already in use (${slug})`);
    this.name = 'SlugInUseError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

export class LedgerBoardError extends Error {
  constructor() {
    super('Entries on the Monthly revenue board come from the ledger and cannot be added by hand');
    this.name = 'LedgerBoardError';
  }
}

/** True for Postgres unique_violation (23505), from postgres-js or PGlite (possibly wrapped by drizzle). */
export function isUniqueViolation(err: unknown): boolean {
  let e: unknown = err;
  for (let i = 0; i < 4 && e; i++) {
    if (typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23505') return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
