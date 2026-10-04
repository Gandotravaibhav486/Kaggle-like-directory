import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../client';
import type { PageKind } from '../domain/types';
import { pageRevisions, pages, type Page, type PageRevision } from '../schema';
import { NotFoundError } from './errors';

export async function getPage(db: Db, competitionId: string, kind: PageKind): Promise<Page | null> {
  const [row] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.competitionId, competitionId), eq(pages.kind, kind)))
    .limit(1);
  return row ?? null;
}

/** Newest first. */
export async function listPageRevisions(db: Db, pageId: string): Promise<PageRevision[]> {
  return db.select().from(pageRevisions).where(eq(pageRevisions.pageId, pageId)).orderBy(desc(pageRevisions.revision));
}

export async function getPageRevision(db: Db, pageId: string, revision: number): Promise<PageRevision | null> {
  const [row] = await db
    .select()
    .from(pageRevisions)
    .where(and(eq(pageRevisions.pageId, pageId), eq(pageRevisions.revision, revision)))
    .limit(1);
  return row ?? null;
}

async function writeRevision(
  db: Db,
  args: { pageId: string; bodyMd: string; actorEmail: string; note?: string | null; restoredFromRevision?: number | null },
): Promise<Page> {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .update(pages)
      .set({
        bodyMd: args.bodyMd,
        currentRevision: sql`${pages.currentRevision} + 1`,
        updatedAt: new Date(),
        updatedBy: args.actorEmail,
      })
      .where(eq(pages.id, args.pageId))
      .returning();
    if (!page) throw new NotFoundError('Page');
    await tx.insert(pageRevisions).values({
      pageId: page.id,
      revision: page.currentRevision,
      bodyMd: args.bodyMd,
      note: args.note ?? null,
      restoredFromRevision: args.restoredFromRevision ?? null,
      createdBy: args.actorEmail,
    });
    return page;
  });
}

/** Saves a new body: increments current_revision and inserts a revision row (one transaction). */
export async function savePageBody(
  db: Db,
  args: { pageId: string; bodyMd: string; actorEmail: string; note?: string },
): Promise<Page> {
  return writeRevision(db, args);
}

/** Non-destructive restore: a new revision copying the old body, with restored_from_revision set. */
export async function restorePageRevision(
  db: Db,
  args: { pageId: string; revision: number; actorEmail: string },
): Promise<Page> {
  const old = await getPageRevision(db, args.pageId, args.revision);
  if (!old) throw new NotFoundError(`Revision #${args.revision}`);
  return writeRevision(db, {
    pageId: args.pageId,
    bodyMd: old.bodyMd,
    actorEmail: args.actorEmail,
    note: `Restored from #${args.revision}`,
    restoredFromRevision: args.revision,
  });
}
