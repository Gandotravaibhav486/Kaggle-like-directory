import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Db } from '../../src/client';
import { runMigrations } from '../../src/migrate';
import * as schema from '../../src/schema';
import { seed } from '../../src/seed';

export async function freshDb(opts: { seed?: boolean } = {}): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle({ client, schema }) as unknown as Db;
  await runMigrations(db, 'pglite');
  if (opts.seed !== false) await seed(db);
  return { db, close: () => client.close() };
}
