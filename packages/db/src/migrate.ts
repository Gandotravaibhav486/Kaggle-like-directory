import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from './client';

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

/** Applies the committed SQL migrations in packages/db/drizzle. */
export async function runMigrations(db: Db, kind: 'postgres-js' | 'pglite'): Promise<void> {
  if (kind === 'pglite') {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db as never, { migrationsFolder });
  }
}
