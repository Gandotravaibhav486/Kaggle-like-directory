import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { publicRevenueBoardEntries } from '../domain/public-ledger';
import { bestEntry, gapToTarget, progressToTarget, rankEntries, type Ranked } from '../domain/ranking';
import type { BoardInput, EntryInput } from '../domain/validation';
import { boardEntries, boards, type Board, type BoardEntry, type Competition } from '../schema';
import { LedgerBoardError, NotFoundError } from './errors';
import { getPublicLedger } from './ledger';

/** A rankable row shared by manual entries and ledger-derived revenue entries. */
export interface EntryLike {
  id: string;
  label: string;
  value: number;
  entryDate: string | null;
  sourceNote: string | null;
  evidenceUrl: string | null;
  example: boolean;
  /** Only on ledger-derived (monthly revenue) entries. */
  payingCustomers?: number;
  /** false for ledger-derived entries, which cannot be edited or deleted. */
  editable: boolean;
}

export interface BoardView {
  board: Board;
  ranked: Ranked<EntryLike>[];
  best: EntryLike | null;
  gap: number | null;
  progress: number | null;
}

export async function listBoards(db: Db, competitionId: string): Promise<Board[]> {
  return db
    .select()
    .from(boards)
    .where(eq(boards.competitionId, competitionId))
    .orderBy(asc(boards.position), asc(boards.createdAt));
}

export async function getBoardBySlug(db: Db, competitionId: string, boardSlug: string): Promise<Board | null> {
  const [row] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.competitionId, competitionId), eq(boards.slug, boardSlug)))
    .limit(1);
  return row ?? null;
}

export async function getBoardById(db: Db, boardId: string): Promise<Board | null> {
  const [row] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1);
  return row ?? null;
}

export async function listBoardEntries(db: Db, boardId: string): Promise<BoardEntry[]> {
  return db
    .select()
    .from(boardEntries)
    .where(eq(boardEntries.boardId, boardId))
    .orderBy(asc(boardEntries.createdAt), asc(boardEntries.id));
}

export async function getEntryById(db: Db, entryId: string): Promise<BoardEntry | null> {
  const [row] = await db.select().from(boardEntries).where(eq(boardEntries.id, entryId)).limit(1);
  return row ?? null;
}

/** Ranks the board. Ledger-derived boards read only the public ledger projection. */
export async function getBoardView(db: Db, competition: Competition, board: Board): Promise<BoardView> {
  let entries: EntryLike[];
  if (board.source === 'ledger_revenue') {
    const pub = await getPublicLedger(db, competition.id);
    entries = publicRevenueBoardEntries(pub, competition.currency).map((e) => ({ ...e, editable: false }));
  } else {
    const rows = await listBoardEntries(db, board.id);
    entries = rows.map((r) => ({
      id: r.id,
      label: r.label,
      value: r.value,
      entryDate: r.entryDate,
      sourceNote: r.sourceNote,
      evidenceUrl: r.evidenceUrl,
      example: r.example,
      editable: true,
    }));
  }
  const ranked = rankEntries(entries, board.direction);
  const best = bestEntry(entries, board.direction);
  return {
    board,
    ranked,
    best,
    gap: best ? gapToTarget(best.value, board.target, board.direction) : null,
    progress: best ? progressToTarget(best.value, board.target, board.direction) : null,
  };
}

export async function createBoard(db: Db, competitionId: string, input: BoardInput): Promise<Board> {
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql<number>`coalesce(max(${boards.position}), -1) + 1` })
    .from(boards)
    .where(eq(boards.competitionId, competitionId));
  const [row] = await db
    .insert(boards)
    .values({
      competitionId,
      slug: input.slug,
      title: input.title,
      objective: input.objective,
      unit: input.unit,
      direction: input.direction,
      target: input.target ?? null,
      period: input.period,
      decimals: input.decimals ?? 2,
      source: 'manual',
      position: Number(next),
    })
    .returning();
  return row!;
}

export async function updateBoard(db: Db, boardId: string, input: BoardInput): Promise<Board> {
  const [row] = await db
    .update(boards)
    .set({
      slug: input.slug,
      title: input.title,
      objective: input.objective,
      unit: input.unit,
      direction: input.direction,
      target: input.target ?? null,
      period: input.period,
      decimals: input.decimals ?? 2,
      updatedAt: new Date(),
    })
    .where(eq(boards.id, boardId))
    .returning();
  if (!row) throw new NotFoundError('Board');
  return row;
}

export async function deleteBoard(db: Db, boardId: string): Promise<void> {
  await db.delete(boards).where(eq(boards.id, boardId));
}

/** Rejects ledger_revenue boards (LedgerBoardError). */
export async function addEntry(db: Db, boardId: string, input: EntryInput): Promise<BoardEntry> {
  const board = await getBoardById(db, boardId);
  if (!board) throw new NotFoundError('Board');
  if (board.source === 'ledger_revenue') throw new LedgerBoardError();
  const [row] = await db
    .insert(boardEntries)
    .values({
      boardId,
      label: input.label,
      value: input.value,
      entryDate: input.entryDate,
      sourceNote: input.sourceNote,
      evidenceUrl: input.evidenceUrl ?? null,
      example: input.example ?? false,
      // clock_timestamp (not now()) so entries inserted in one transaction keep insertion order.
      createdAt: sql`clock_timestamp()`,
    })
    .returning();
  await db.update(boards).set({ updatedAt: new Date() }).where(eq(boards.id, boardId));
  return row!;
}

export async function updateEntry(db: Db, entryId: string, input: EntryInput): Promise<BoardEntry> {
  const [row] = await db
    .update(boardEntries)
    .set({
      label: input.label,
      value: input.value,
      entryDate: input.entryDate,
      sourceNote: input.sourceNote,
      evidenceUrl: input.evidenceUrl ?? null,
      example: input.example ?? false,
      updatedAt: new Date(),
    })
    .where(eq(boardEntries.id, entryId))
    .returning();
  if (!row) throw new NotFoundError('Entry');
  return row;
}

export async function deleteEntry(db: Db, entryId: string): Promise<void> {
  await db.delete(boardEntries).where(eq(boardEntries.id, entryId));
}

/** Deletes every example=true entry of the season. Returns the number removed. */
export async function removeExampleEntries(db: Db, competitionId: string): Promise<number> {
  const boardIds = db.select({ id: boards.id }).from(boards).where(eq(boards.competitionId, competitionId));
  const removed = await db
    .delete(boardEntries)
    .where(and(eq(boardEntries.example, true), inArray(boardEntries.boardId, boardIds)))
    .returning({ id: boardEntries.id });
  return removed.length;
}
