import { sql } from 'drizzle-orm';
import type { Db } from '../client';

export async function ping(db: Db): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
