import { and, eq } from 'drizzle-orm';
import type { Db } from '../client';
import { PAGE_KINDS } from '../domain/types';
import { boardEntries, boards, competitions, pageRevisions, pages, resources, threads } from '../schema';
import { SEED_BOARDS, SEED_COMPETITION, SEED_PAGES, SEED_RESOURCES, SEED_THREADS } from './content';

export interface SeedReport {
  competitionId: string;
  createdCompetition: boolean;
  pages: number;
  boards: number;
  entries: number;
  threads: number;
  resources: number;
}

const SEED_AUTHOR = 'Founder';

/**
 * Idempotent seed (one transaction). The default competition and its five pages are ensured
 * on every run. Boards, example entries, threads and resources are only inserted when the
 * competition is created, so owner deletions (e.g. "remove all examples") are never undone.
 * Inserts use natural keys / seed_key with ON CONFLICT DO NOTHING and never overwrite edits.
 * The ledger is seeded empty.
 */
export async function seed(db: Db): Promise<SeedReport> {
  return db.transaction(async (tx) => {
    const report: SeedReport = {
      competitionId: '',
      createdCompetition: false,
      pages: 0,
      boards: 0,
      entries: 0,
      threads: 0,
      resources: 0,
    };

    const inserted = await tx
      .insert(competitions)
      .values({ ...SEED_COMPETITION })
      .onConflictDoNothing({ target: competitions.slug })
      .returning({ id: competitions.id });
    let competitionId = inserted[0]?.id;
    report.createdCompetition = Boolean(competitionId);
    if (!competitionId) {
      const [existing] = await tx
        .select({ id: competitions.id })
        .from(competitions)
        .where(eq(competitions.slug, SEED_COMPETITION.slug))
        .limit(1);
      competitionId = existing!.id;
    }
    report.competitionId = competitionId;

    for (const kind of PAGE_KINDS) {
      const body = SEED_PAGES[kind];
      const [page] = await tx
        .insert(pages)
        .values({ competitionId, kind, bodyMd: body, currentRevision: 1, updatedBy: null })
        .onConflictDoNothing({ target: [pages.competitionId, pages.kind] })
        .returning({ id: pages.id });
      if (page) {
        report.pages++;
        await tx
          .insert(pageRevisions)
          .values({ pageId: page.id, revision: 1, bodyMd: body, note: 'Seeded', createdBy: null })
          .onConflictDoNothing();
      }
    }

    if (!report.createdCompetition) return report;

    for (const b of SEED_BOARDS) {
      const { entries, ...boardValues } = b;
      const [board] = await tx
        .insert(boards)
        .values({ competitionId, ...boardValues })
        .onConflictDoNothing({ target: [boards.competitionId, boards.slug] })
        .returning({ id: boards.id });
      if (!board) continue;
      report.boards++;
      for (const e of entries) {
        const rows = await tx
          .insert(boardEntries)
          .values({ boardId: board.id, ...e, evidenceUrl: null, example: true, createdAt: new Date(Date.now() + report.entries) })
          .onConflictDoNothing({ target: boardEntries.seedKey })
          .returning({ id: boardEntries.id });
        report.entries += rows.length;
      }
    }

    // Stagger timestamps so the threads have a stable order (first listed is newest).
    const base = Date.now();
    for (const [i, t] of SEED_THREADS.entries()) {
      const at = new Date(base - (i + 1) * 60_000);
      const rows = await tx
        .insert(threads)
        .values({
          competitionId,
          title: t.title,
          tag: t.tag,
          bodyMd: t.bodyMd,
          authorName: SEED_AUTHOR,
          seedKey: t.seedKey,
          createdAt: at,
          updatedAt: at,
          lastActivityAt: at,
        })
        .onConflictDoNothing({ target: threads.seedKey })
        .returning({ id: threads.id });
      report.threads += rows.length;
    }

    for (const [i, r] of SEED_RESOURCES.entries()) {
      const rows = await tx
        .insert(resources)
        .values({ competitionId, ...r, position: i, createdAt: new Date(Date.now() + i) })
        .onConflictDoNothing({ target: resources.seedKey })
        .returning({ id: resources.id });
      report.resources += rows.length;
    }

    return report;
  });
}

/** Convenience for tests and scripts. */
export async function getSeedCompetitionId(db: Db): Promise<string | null> {
  const [row] = await db
    .select({ id: competitions.id })
    .from(competitions)
    .where(and(eq(competitions.slug, SEED_COMPETITION.slug)))
    .limit(1);
  return row?.id ?? null;
}

export { SEED_BOARDS, SEED_COMPETITION, SEED_PAGES, SEED_RESOURCES, SEED_THREADS } from './content';
