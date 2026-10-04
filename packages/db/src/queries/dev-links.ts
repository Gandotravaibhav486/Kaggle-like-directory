import { desc, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { devMagicLinks } from '../schema';

export async function recordDevMagicLink(
  db: Db,
  args: { email: string; url: string; app: 'arena' | 'lab' },
): Promise<void> {
  await db.insert(devMagicLinks).values({ email: args.email.trim().toLowerCase(), url: args.url, app: args.app });
}

export async function latestDevMagicLink(
  db: Db,
  email: string,
): Promise<{ url: string; createdAt: Date; app: string } | null> {
  const [row] = await db
    .select({ url: devMagicLinks.url, createdAt: devMagicLinks.createdAt, app: devMagicLinks.app })
    .from(devMagicLinks)
    .where(sql`lower(${devMagicLinks.email}) = ${email.trim().toLowerCase()}`)
    .orderBy(desc(devMagicLinks.createdAt))
    .limit(1);
  return row ?? null;
}
