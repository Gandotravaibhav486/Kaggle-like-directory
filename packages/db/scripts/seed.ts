import { seed } from '../src/seed';
import { describeTarget, withDb } from './with-db';

await withDb(async (db, ctx) => {
  console.log(`[seed] seeding ${describeTarget(ctx)}`);
  const report = await seed(db);
  console.log('[seed] done', report);
});
