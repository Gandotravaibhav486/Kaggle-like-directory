import { runMigrations } from '../src/migrate';
import { describeTarget, withDb } from './with-db';

await withDb(async (db, ctx) => {
  console.log(`[migrate] applying migrations to ${describeTarget(ctx)}`);
  await runMigrations(db, 'postgres-js');
  console.log('[migrate] done');
});
