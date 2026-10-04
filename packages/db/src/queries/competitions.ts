import { asc, eq } from 'drizzle-orm';
import type { Db } from '../client';
import { PAGE_KINDS } from '../domain/types';
import type { SeasonInput } from '../domain/validation';
import { boards, competitions, pageRevisions, pages, type Competition } from '../schema';
import { isUniqueViolation, SlugInUseError } from './errors';
import { LEDGER_BOARD_TEMPLATE, templatePageBody } from './templates';

export async function getCompetitionBySlug(db: Db, slug: string): Promise<Competition | null> {
  const [row] = await db.select().from(competitions).where(eq(competitions.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCompetitionById(db: Db, id: string): Promise<Competition | null> {
  const [row] = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);
  return row ?? null;
}

export async function listCompetitions(db: Db): Promise<Competition[]> {
  return db.select().from(competitions).orderBy(asc(competitions.createdAt), asc(competitions.slug));
}

/**
 * Creates a season: the competition row, the five pages from templates (revision 1 each)
 * and the ledger-derived 'monthly-revenue' board. Throws SlugInUseError for a taken slug.
 */
export async function createSeason(db: Db, input: SeasonInput, actorEmail: string): Promise<Competition> {
  if (await getCompetitionBySlug(db, input.slug)) throw new SlugInUseError(input.slug);
  try {
    return await db.transaction(async (tx) => {
      const [comp] = await tx
        .insert(competitions)
        .values({
          slug: input.slug,
          title: input.title,
          tagline: input.tagline ?? '',
          startsOn: input.startsOn ?? null,
          endsOn: input.endsOn ?? null,
          currency: input.currency ?? 'INR',
        })
        .returning();
      if (!comp) throw new Error('Failed to create competition');
      for (const kind of PAGE_KINDS) {
        const body = templatePageBody(kind, comp.title);
        const [page] = await tx
          .insert(pages)
          .values({ competitionId: comp.id, kind, bodyMd: body, currentRevision: 1, updatedBy: actorEmail })
          .returning();
        await tx.insert(pageRevisions).values({
          pageId: page!.id,
          revision: 1,
          bodyMd: body,
          note: 'Created from template',
          createdBy: actorEmail,
        });
      }
      await tx.insert(boards).values({
        competitionId: comp.id,
        ...LEDGER_BOARD_TEMPLATE,
        unit: comp.currency,
        position: 0,
      });
      return comp;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new SlugInUseError(input.slug);
    throw err;
  }
}
