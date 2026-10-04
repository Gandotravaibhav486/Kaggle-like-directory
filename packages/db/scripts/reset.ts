import { sql } from 'drizzle-orm';
import { loadRootEnv } from '../src/env';
import { runMigrations } from '../src/migrate';
import { seed } from '../src/seed';
import { describeTarget, isLocalUrl, withDb } from './with-db';

loadRootEnv();
const force = process.argv.includes('--force');
const remote = process.env.DATABASE_URL?.trim();
if (remote && !isLocalUrl(remote) && !force) {
  console.error('[reset] DATABASE_URL points at a non-local host. Refusing to wipe it. Pass --force if you really mean it.');
  process.exit(1);
}

await withDb(async (db, ctx) => {
  console.log(`[reset] wiping ${describeTarget(ctx)}`);
  await db.execute(sql.raw('drop schema if exists public cascade'));
  await db.execute(sql.raw('drop schema if exists drizzle cascade'));
  await db.execute(sql.raw('create schema public'));
  await runMigrations(db, 'postgres-js');
  console.log('[reset] migrated');
  const report = await seed(db);
  console.log('[reset] seeded', report);
});
