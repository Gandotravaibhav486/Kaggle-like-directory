import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '../../src/client';
import { ledgerMonthInputSchema, seasonInputSchema } from '../../src/domain/validation';
import {
  addEntry,
  authenticateAgentToken,
  consumeRateLimit,
  createAgentReply,
  createAgentToken,
  createBoard,
  createPersonReply,
  createSeason,
  DuplicateMonthError,
  getBoardBySlug,
  getBoardView,
  getCompetitionBySlug,
  getPage,
  getPublicLedger,
  latestDevMagicLink,
  LedgerBoardError,
  listAgentTokens,
  listBoards,
  listLatestThreads,
  listLedgerMonths,
  listPageRevisions,
  listReplies,
  listResources,
  listThreads,
  ping,
  recordDevMagicLink,
  removeExampleEntries,
  restorePageRevision,
  revokeAgentToken,
  savePageBody,
  setLedgerMonthShared,
  setReplyHidden,
  SlugInUseError,
  upsertLedgerMonth,
} from '../../src/queries';
import * as s from '../../src/schema';
import { exportSeason, importSeason } from '../../src/season';
import { seed } from '../../src/seed';
import { freshDb } from './helpers';

let db: Db;
let close: () => Promise<void>;
let compId: string;

beforeAll(async () => {
  ({ db, close } = await freshDb());
  compId = (await getCompetitionBySlug(db, 'mock-interview-v5'))!.id;
});
afterAll(async () => close());

const ledger = (month: string, shared: boolean, revenue = '5000') =>
  ledgerMonthInputSchema.parse({
    month,
    revenue,
    payingCustomers: '2',
    invoicesRaised: '3',
    invoicesPaid: '2',
    hosting: '777.77',
    speech: '88.88',
    aiUsage: '999.99',
    other: '66.66',
    note: 'secret note',
    sharedPublicly: shared ? 'on' : '',
  });

const tableCounts = async () => {
  const tables = [s.competitions, s.pages, s.pageRevisions, s.boards, s.boardEntries, s.threads, s.resources, s.ledgerMonths];
  return Promise.all(tables.map(async (t) => (await db.select({ n: count() }).from(t))[0]!.n));
};

describe('seed', () => {
  it('creates the starter content with the ledger empty', async () => {
    expect(await ping(db)).toBe(true);
    const boards = await listBoards(db, compId);
    expect(boards.map((b) => b.slug)).toEqual(['scoring-stability', 'reach-by-channel', 'monthly-revenue']);
    expect(boards.find((b) => b.slug === 'scoring-stability')!.direction).toBe('lower');
    expect(boards.find((b) => b.slug === 'monthly-revenue')!.source).toBe('ledger_revenue');
    const threads = await listThreads(db, compId);
    expect(threads).toHaveLength(4);
    expect(threads.map((t) => t.tag).sort()).toEqual(['growth', 'product', 'reporting', 'scoring']);
    expect(await listResources(db, compId)).toHaveLength(10);
    expect(await listLedgerMonths(db, compId)).toHaveLength(0);
    for (const kind of ['overview', 'description', 'evaluation', 'rules', 'timeline'] as const) {
      const page = await getPage(db, compId, kind);
      expect(page?.bodyMd.length).toBeGreaterThan(200);
      expect(await listPageRevisions(db, page!.id)).toHaveLength(1);
    }
  });

  it('flags every seeded entry as an example', async () => {
    const entries = await db.select().from(s.boardEntries);
    expect(entries.length).toBe(7);
    expect(entries.every((e) => e.example)).toBe(true);
  });

  it('runs twice idempotently and never overwrites owner edits', async () => {
    const page = (await getPage(db, compId, 'rules'))!;
    await savePageBody(db, { pageId: page.id, bodyMd: 'Owner edit', actorEmail: 'o@x.test' });
    const before = await tableCounts();
    const report = await seed(db);
    expect(report).toMatchObject({ createdCompetition: false, pages: 0, boards: 0, entries: 0, threads: 0, resources: 0 });
    await seed(db);
    expect(await tableCounts()).toEqual(before);
    expect((await getPage(db, compId, 'rules'))!.bodyMd).toBe('Owner edit');
  });
});

describe('pages and revisions', () => {
  it('savePageBody increments the revision; restore creates a new revision', async () => {
    const page = (await getPage(db, compId, 'timeline'))!;
    const original = page.bodyMd;
    const p2 = await savePageBody(db, { pageId: page.id, bodyMd: 'Second', actorEmail: 'o@x.test' });
    expect(p2.currentRevision).toBe(2);
    const p3 = await savePageBody(db, { pageId: page.id, bodyMd: 'Third', actorEmail: 'o@x.test' });
    expect(p3.currentRevision).toBe(3);
    const restored = await restorePageRevision(db, { pageId: page.id, revision: 1, actorEmail: 'o@x.test' });
    expect(restored.currentRevision).toBe(4);
    expect(restored.bodyMd).toBe(original);
    const revs = await listPageRevisions(db, page.id);
    expect(revs.map((r) => r.revision)).toEqual([4, 3, 2, 1]);
    expect(revs[0]).toMatchObject({ restoredFromRevision: 1, bodyMd: original, note: 'Restored from #1' });
  });
});

describe('ledger privacy', () => {
  it('getPublicLedger returns only shared months with exactly 3 keys', async () => {
    const aug = await upsertLedgerMonth(db, compId, ledger('2026-08', false));
    await upsertLedgerMonth(db, compId, ledger('2026-09', true, '12345.67'));
    expect(await listLedgerMonths(db, compId)).toHaveLength(2);
    let pub = await getPublicLedger(db, compId);
    expect(pub).toEqual([{ month: '2026-09', revenueMinor: 1_234_567, payingCustomers: 2 }]);
    for (const p of pub) expect(Object.keys(p).sort()).toEqual(['month', 'payingCustomers', 'revenueMinor']);
    const json = JSON.stringify(pub);
    expect(json).not.toMatch(/77777|8888|99999|6666|secret note/);

    await setLedgerMonthShared(db, aug.id, true);
    pub = await getPublicLedger(db, compId);
    expect(pub.map((p) => p.month)).toEqual(['2026-08', '2026-09']);
    await setLedgerMonthShared(db, aug.id, false);
    expect((await getPublicLedger(db, compId)).map((p) => p.month)).toEqual(['2026-09']);
  });

  it('feeds the public revenue board from shared months only', async () => {
    const comp = (await getCompetitionBySlug(db, 'mock-interview-v5'))!;
    const board = (await getBoardBySlug(db, compId, 'monthly-revenue'))!;
    const view = await getBoardView(db, comp, board);
    expect(view.ranked.map((r) => r.entry.label)).toEqual(['Sep 2026']);
    expect(view.best?.value).toBe(12345.67);
    expect(view.ranked[0]!.entry.payingCustomers).toBe(2);
    await expect(addEntry(db, board.id, { label: 'x', value: 1, entryDate: '2026-09-01', sourceNote: 'abc', evidenceUrl: null, example: false })).rejects.toBeInstanceOf(LedgerBoardError);
  });

  it('rejects a duplicate month', async () => {
    await expect(upsertLedgerMonth(db, compId, ledger('2026-09', false))).rejects.toBeInstanceOf(DuplicateMonthError);
  });
});

describe('boards', () => {
  it('ranks a lower board ascending and computes gap/progress; removes examples', async () => {
    const comp = (await getCompetitionBySlug(db, 'mock-interview-v5'))!;
    const board = await createBoard(db, compId, { title: 'Latency', objective: 'p95', unit: 'ms', direction: 'lower', target: 100, period: 'weekly', slug: 'latency', decimals: 0 });
    for (const [label, value] of [['a', 200], ['b', 150], ['c', 150]] as const) {
      await addEntry(db, board.id, { label, value, entryDate: '2026-09-01', sourceNote: 'measured', evidenceUrl: null, example: false });
      await new Promise((r) => setTimeout(r, 3)); // PGlite's clock has millisecond resolution
    }
    const view = await getBoardView(db, comp, board);
    expect(view.ranked.map((r) => [r.entry.label, r.rank])).toEqual([['b', 1], ['c', 1], ['a', 3]]);
    expect(view.gap).toBe(50);
    expect(view.progress).toBeCloseTo(100 / 150);

    const removed = await removeExampleEntries(db, compId);
    expect(removed).toBe(7); // 3 scoring-stability + 4 reach-by-channel examples
    const left = await db.select().from(s.boardEntries);
    expect(left).toHaveLength(3);
    expect(left.every((e) => !e.example)).toBe(true);
    expect(await removeExampleEntries(db, compId)).toBe(0);
  });

  it('the DB rejects a blank source note even if validation is bypassed', async () => {
    const board = (await getBoardBySlug(db, compId, 'latency'))!;
    await expect(
      db.insert(s.boardEntries).values({ boardId: board.id, label: 'x', value: 1, entryDate: '2026-09-01', sourceNote: '   ' }),
    ).rejects.toThrow();
  });
});

describe('discussion', () => {
  it('lists threads with visible reply counts and hides hidden reply content from visitors', async () => {
    const [thread] = await listThreads(db, compId, { limit: 1 });
    const person = await createPersonReply(db, thread!.id, { bodyMd: 'hello', authorName: 'Asha' });
    const agent = await createAgentReply(db, {
      threadId: thread!.id,
      agentName: 'Claude (mock)',
      source: 'claude_button',
      payload: { observations: ['o'], suggestions: [], biggestRisk: 'r', missingInformation: [] },
      model: 'mock',
      isMock: true,
    });
    await setReplyHidden(db, agent.id, true);
    const visitor = await listReplies(db, thread!.id, { includeHidden: false });
    expect(visitor).toHaveLength(2);
    const hidden = visitor.find((r) => r.id === agent.id)!;
    expect(hidden).toMatchObject({ hidden: true, agentPayload: null, bodyMd: '' });
    const owner = await listReplies(db, thread!.id, { includeHidden: true });
    expect(owner.find((r) => r.id === agent.id)!.agentPayload).not.toBeNull();
    expect(visitor.find((r) => r.id === person.id)!.bodyMd).toBe('hello');
    const [summary] = (await listThreads(db, compId)).filter((t) => t.id === thread!.id);
    expect(summary!.replyCount).toBe(1);
    const latest = await listLatestThreads(db, 'mock-interview-v5', 3);
    expect(latest).toHaveLength(3);
    expect(latest[0]!.id).toBe(thread!.id);
  });

  it('the DB rejects an agent reply without a payload', async () => {
    const [thread] = await listThreads(db, compId, { limit: 1 });
    await expect(db.insert(s.replies).values({ threadId: thread!.id, authorType: 'agent', authorName: 'x' })).rejects.toThrow();
  });
});

describe('agent tokens', () => {
  it('stores only the hash, authenticates, rate limits and revokes', async () => {
    const { token, plaintext } = await createAgentToken(db, compId, { name: 'Bot', rateLimit: 3, rateWindowSeconds: 60 }, 'o@x.test');
    expect(plaintext.startsWith(token.tokenPrefix)).toBe(true);
    expect(JSON.stringify(await listAgentTokens(db, compId))).not.toContain(plaintext);
    expect(Object.keys(token)).not.toContain('tokenHash');
    const [stored] = await db.select().from(s.agentTokens).where(eq(s.agentTokens.id, token.id));
    expect(stored!.tokenHash).not.toBe(plaintext);

    const auth = await authenticateAgentToken(db, plaintext);
    expect(auth?.id).toBe(token.id);
    expect(await authenticateAgentToken(db, plaintext + 'x')).toBeNull();

    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consumeRateLimit(db, token.id));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[3]!.retryAfterSeconds).toBeGreaterThan(0);
    expect(results[3]!.retryAfterSeconds).toBeLessThanOrEqual(60);

    // window expiry resets the count
    await db.update(s.agentTokens).set({ windowStartedAt: new Date(Date.now() - 61_000) }).where(eq(s.agentTokens.id, token.id));
    expect((await consumeRateLimit(db, token.id)).allowed).toBe(true);

    await revokeAgentToken(db, token.id);
    expect(await authenticateAgentToken(db, plaintext)).toBeNull();
    expect((await consumeRateLimit(db, token.id)).allowed).toBe(false);
  });
});

describe('dev magic links', () => {
  it('returns the latest link for an email, case-insensitively', async () => {
    await recordDevMagicLink(db, { email: 'Owner@Example.test', url: 'http://a/1', app: 'arena' });
    await new Promise((r) => setTimeout(r, 5));
    await recordDevMagicLink(db, { email: 'owner@example.test', url: 'http://a/2', app: 'lab' });
    expect(await latestDevMagicLink(db, 'OWNER@example.test')).toMatchObject({ url: 'http://a/2', app: 'lab' });
    expect(await latestDevMagicLink(db, 'nobody@example.test')).toBeNull();
  });
});

describe('seasons', () => {
  it('createSeason makes 5 template pages and the ledger board; duplicate slug throws', async () => {
    const comp = await createSeason(db, seasonInputSchema.parse({ slug: 'season-two', title: 'Season two' }), 'o@x.test');
    const boards = await listBoards(db, comp.id);
    expect(boards.map((b) => [b.slug, b.source])).toEqual([['monthly-revenue', 'ledger_revenue']]);
    for (const kind of ['overview', 'description', 'evaluation', 'rules', 'timeline'] as const) {
      const p = await getPage(db, comp.id, kind);
      expect(p?.currentRevision).toBe(1);
      expect(p!.bodyMd).not.toMatch(/\d{2,}/);
    }
    await expect(createSeason(db, seasonInputSchema.parse({ slug: 'season-two', title: 'Again' }), 'o@x.test')).rejects.toBeInstanceOf(SlugInUseError);
  });

  it('exports and re-imports a season under a new slug (round trip)', async () => {
    const file = await exportSeason(db, compId);
    expect(file.format).toBe('mi-season');
    expect(file.version).toBe(1);
    expect(file.pages).toHaveLength(5);
    const json = JSON.stringify(file);
    expect(json).not.toMatch(/token_hash|tokenHash|"id":/);

    const res = await importSeason(db, json, { newSlug: 'v5-copy', newTitle: 'V5 copy', actorEmail: 'o@x.test' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.competition).toMatchObject({ slug: 'v5-copy', title: 'V5 copy' });
    const again = await exportSeason(db, res.competition.id);
    const strip = (f: typeof file) => ({ ...f, exportedAt: '', competition: { ...f.competition, slug: '', title: '' } });
    expect(strip(again)).toEqual(strip(file));
    const page = (await getPage(db, res.competition.id, 'overview'))!;
    expect(page.currentRevision).toBe(1);
    // flags survive
    expect(again.ledgerMonths.map((m) => [m.month, m.sharedPublicly])).toEqual(file.ledgerMonths.map((m) => [m.month, m.sharedPublicly]));
    expect(again.threads.flatMap((t) => t.replies).some((r) => r.hidden)).toBe(true);
    expect(await getPublicLedger(db, res.competition.id)).toEqual(await getPublicLedger(db, compId));
  });

  it('rejects malformed JSON, wrong format, used slugs and invalid entries without writing anything', async () => {
    const before = await tableCounts();
    expect(await importSeason(db, '{not json', { newSlug: 'x-one', actorEmail: 'o' })).toMatchObject({ ok: false });
    expect(await importSeason(db, { format: 'other', version: 1 }, { newSlug: 'x-two', actorEmail: 'o' })).toMatchObject({ ok: false });
    const file = await exportSeason(db, compId);
    expect(await importSeason(db, file, { newSlug: 'mock-interview-v5', actorEmail: 'o' })).toMatchObject({ ok: false, error: 'Slug already in use' });
    expect(await importSeason(db, file, { newSlug: 'Bad Slug', actorEmail: 'o' })).toMatchObject({ ok: false });
    const bad = structuredClone(file);
    bad.boards.find((b) => b.slug === 'latency')!.entries[0]!.sourceNote = '';
    const r = await importSeason(db, bad, { newSlug: 'x-three', actorEmail: 'o' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues?.join(' ')).toContain('A source note is required');
    expect(await tableCounts()).toEqual(before);
  });
});
