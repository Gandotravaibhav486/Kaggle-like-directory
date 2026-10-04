import { asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../client';
import { PAGE_KINDS, THREAD_TAGS, type PageKind } from '../domain/types';
import { agentReplyPayloadSchema, entryInputSchema, slugSchema, type AgentReplyPayload } from '../domain/validation';
import {
  boardEntries,
  boards,
  competitions,
  ledgerMonths,
  pageRevisions,
  pages,
  replies,
  resources,
  threads,
  type Competition,
} from '../schema';
import { getCompetitionBySlug } from '../queries/competitions';
import { isUniqueViolation } from '../queries/errors';
import { templatePageBody } from '../queries/templates';

export const SEASON_FORMAT = 'mi-season' as const;
export const SEASON_VERSION = 1 as const;

export interface SeasonFile {
  format: 'mi-season';
  version: 1;
  exportedAt: string;
  competition: {
    slug: string;
    title: string;
    tagline: string;
    startsOn: string | null;
    endsOn: string | null;
    currency: string;
  };
  pages: Array<{ kind: PageKind; bodyMd: string }>;
  boards: Array<{
    slug: string;
    title: string;
    objective: string;
    unit: string;
    direction: 'higher' | 'lower';
    target: number | null;
    period: string;
    source: 'manual' | 'ledger_revenue';
    decimals: number;
    position: number;
    entries: Array<{
      label: string;
      value: number;
      entryDate: string;
      sourceNote: string;
      evidenceUrl: string | null;
      example: boolean;
    }>;
  }>;
  ledgerMonths: Array<{
    month: string; // 'YYYY-MM'
    revenueMinor: number;
    payingCustomers: number;
    invoicesRaised: number;
    invoicesPaid: number;
    hostingMinor: number;
    speechMinor: number;
    aiUsageMinor: number;
    otherMinor: number;
    note: string;
    sharedPublicly: boolean;
  }>;
  resources: Array<{
    name: string;
    kind: 'model' | 'service' | 'dataset' | 'tool' | 'platform' | 'channel';
    url: string | null;
    usedFor: string;
    notes: string;
    position: number;
  }>;
  threads: Array<{
    title: string;
    tag: string;
    bodyMd: string;
    authorName: string;
    createdAt: string;
    replies: Array<{
      authorType: 'person' | 'agent';
      authorName: string;
      bodyMd: string;
      agentSource: 'claude_button' | 'pasted' | 'api' | null;
      agentPayload: AgentReplyPayload | null;
      model: string | null;
      isMock: boolean;
      hidden: boolean;
      createdAt: string;
    }>;
  }>;
}

const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date-time');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const minorInt = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const countInt = z.number().int().min(0).max(1_000_000);

const replySchema = z
  .object({
    authorType: z.enum(['person', 'agent']),
    authorName: z.string().trim().min(1).max(60),
    bodyMd: z.string().max(10_000).default(''),
    agentSource: z.enum(['claude_button', 'pasted', 'api']).nullable().default(null),
    agentPayload: agentReplyPayloadSchema.nullable().default(null),
    model: z.string().max(200).nullable().default(null),
    isMock: z.boolean().default(false),
    hidden: z.boolean().default(false),
    createdAt: isoDateTime,
  })
  .refine((r) => r.authorType !== 'agent' || (r.agentPayload !== null && r.agentSource !== null), {
    message: 'Agent replies need agentSource and agentPayload',
    path: ['agentPayload'],
  });

export const seasonFileSchema: z.ZodType<SeasonFile> = z.object({
  format: z.literal(SEASON_FORMAT),
  version: z.literal(SEASON_VERSION),
  exportedAt: isoDateTime,
  competition: z.object({
    slug: z.string(),
    title: z.string().trim().min(1).max(120),
    tagline: z.string().max(200).default(''),
    startsOn: isoDate.nullable().default(null),
    endsOn: isoDate.nullable().default(null),
    currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
  }),
  pages: z
    .array(z.object({ kind: z.enum(PAGE_KINDS as [PageKind, ...PageKind[]]), bodyMd: z.string().max(100_000) }))
    .max(PAGE_KINDS.length)
    .refine((ps) => new Set(ps.map((p) => p.kind)).size === ps.length, 'Duplicate page kind'),
  boards: z
    .array(
      z.object({
        slug: slugSchema,
        title: z.string().trim().min(1).max(120),
        objective: z.string().trim().min(1).max(500),
        unit: z.string().trim().min(1).max(30),
        direction: z.enum(['higher', 'lower']),
        target: z.number().finite().nullable().default(null),
        period: z.string().trim().min(1).max(60),
        source: z.enum(['manual', 'ledger_revenue']).default('manual'),
        decimals: z.number().int().min(0).max(4).default(2),
        position: z.number().int().default(0),
        entries: z
          .array(
            z.object({
              label: z.string(),
              value: z.number(),
              entryDate: z.string(),
              sourceNote: z.string(),
              evidenceUrl: z.string().nullable().default(null),
              example: z.boolean().default(false),
            }),
          )
          .max(5000)
          .default([]),
      }),
    )
    .max(200)
    .refine((bs) => new Set(bs.map((b) => b.slug)).size === bs.length, 'Duplicate board slug'),
  ledgerMonths: z
    .array(
      z
        .object({
          month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM'),
          revenueMinor: minorInt,
          payingCustomers: countInt,
          invoicesRaised: countInt,
          invoicesPaid: countInt,
          hostingMinor: minorInt,
          speechMinor: minorInt,
          aiUsageMinor: minorInt,
          otherMinor: minorInt,
          note: z.string().max(2000).default(''),
          sharedPublicly: z.boolean().default(false),
        })
        .refine((m) => m.invoicesPaid <= m.invoicesRaised, {
          message: 'Invoices paid cannot exceed invoices raised',
          path: ['invoicesPaid'],
        }),
    )
    .max(600)
    .refine((ms) => new Set(ms.map((m) => m.month)).size === ms.length, 'Duplicate ledger month')
    .default([]),
  resources: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        kind: z.enum(['model', 'service', 'dataset', 'tool', 'platform', 'channel']),
        url: z.string().max(2000).nullable().default(null),
        usedFor: z.string().trim().min(1).max(500),
        notes: z.string().max(2000).default(''),
        position: z.number().int().default(0),
      }),
    )
    .max(1000)
    .default([]),
  threads: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(140),
        tag: z.enum(THREAD_TAGS),
        bodyMd: z.string().max(20_000),
        authorName: z.string().trim().min(1).max(60),
        createdAt: isoDateTime,
        replies: z.array(replySchema).max(2000).default([]),
      }),
    )
    .max(2000)
    .default([]),
}) as unknown as z.ZodType<SeasonFile>;

const iso = (d: Date) => d.toISOString();

/** Exports one season. Excludes ids, agent tokens, auth data, user ids and revision history. */
export async function exportSeason(db: Db, competitionId: string): Promise<SeasonFile> {
  const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!comp) throw new Error('Competition not found');

  const pageRows = await db.select().from(pages).where(eq(pages.competitionId, competitionId));
  const boardRows = await db
    .select()
    .from(boards)
    .where(eq(boards.competitionId, competitionId))
    .orderBy(asc(boards.position), asc(boards.createdAt));
  const entryRows = boardRows.length
    ? await db
        .select()
        .from(boardEntries)
        .where(
          inArray(
            boardEntries.boardId,
            boardRows.map((b) => b.id),
          ),
        )
        .orderBy(asc(boardEntries.createdAt), asc(boardEntries.id))
    : [];
  const ledgerRows = await db
    .select()
    .from(ledgerMonths)
    .where(eq(ledgerMonths.competitionId, competitionId))
    .orderBy(asc(ledgerMonths.month));
  const resourceRows = await db
    .select()
    .from(resources)
    .where(eq(resources.competitionId, competitionId))
    .orderBy(asc(resources.position), asc(resources.createdAt));
  const threadRows = await db
    .select()
    .from(threads)
    .where(eq(threads.competitionId, competitionId))
    .orderBy(asc(threads.createdAt));
  const replyRows = threadRows.length
    ? await db
        .select()
        .from(replies)
        .where(
          inArray(
            replies.threadId,
            threadRows.map((t) => t.id),
          ),
        )
        .orderBy(asc(replies.createdAt), asc(replies.id))
    : [];

  const kindOrder = (k: string) => PAGE_KINDS.indexOf(k as PageKind);
  return {
    format: SEASON_FORMAT,
    version: SEASON_VERSION,
    exportedAt: iso(new Date()),
    competition: {
      slug: comp.slug,
      title: comp.title,
      tagline: comp.tagline,
      startsOn: comp.startsOn,
      endsOn: comp.endsOn,
      currency: comp.currency,
    },
    pages: [...pageRows]
      .sort((a, b) => kindOrder(a.kind) - kindOrder(b.kind))
      .map((p) => ({ kind: p.kind, bodyMd: p.bodyMd })),
    boards: boardRows.map((b) => ({
      slug: b.slug,
      title: b.title,
      objective: b.objective,
      unit: b.unit,
      direction: b.direction,
      target: b.target,
      period: b.period,
      source: b.source,
      decimals: b.decimals,
      position: b.position,
      entries: entryRows
        .filter((e) => e.boardId === b.id)
        .map((e) => ({
          label: e.label,
          value: e.value,
          entryDate: e.entryDate,
          sourceNote: e.sourceNote,
          evidenceUrl: e.evidenceUrl,
          example: e.example,
        })),
    })),
    ledgerMonths: ledgerRows.map((m) => ({
      month: m.month.slice(0, 7),
      revenueMinor: Number(m.revenueMinor),
      payingCustomers: m.payingCustomers,
      invoicesRaised: m.invoicesRaised,
      invoicesPaid: m.invoicesPaid,
      hostingMinor: Number(m.hostingMinor),
      speechMinor: Number(m.speechMinor),
      aiUsageMinor: Number(m.aiUsageMinor),
      otherMinor: Number(m.otherMinor),
      note: m.note,
      sharedPublicly: m.sharedPublicly,
    })),
    resources: resourceRows.map((r) => ({
      name: r.name,
      kind: r.kind,
      url: r.url,
      usedFor: r.usedFor,
      notes: r.notes,
      position: r.position,
    })),
    threads: threadRows.map((t) => ({
      title: t.title,
      tag: t.tag,
      bodyMd: t.bodyMd,
      authorName: t.authorName,
      createdAt: iso(t.createdAt),
      replies: replyRows
        .filter((r) => r.threadId === t.id)
        .map((r) => ({
          authorType: r.authorType,
          authorName: r.authorName,
          bodyMd: r.bodyMd,
          agentSource: r.agentSource,
          agentPayload: r.agentPayload,
          model: r.model,
          isMock: r.isMock,
          hidden: r.hidden,
          createdAt: iso(r.createdAt),
        })),
    })),
  };
}

function formatIssues(err: z.ZodError, prefix = ''): string[] {
  return err.issues.slice(0, 50).map((i) => `${prefix}${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
}

/**
 * Validates and imports a season file under a NEW slug in one transaction. New ids,
 * revision 1 for every page; example, sharedPublicly and hidden flags are kept.
 * Every entry must still pass entryInputSchema (date and source note required).
 */
export async function importSeason(
  db: Db,
  file: unknown,
  opts: { newSlug: string; newTitle?: string; actorEmail: string },
): Promise<{ ok: true; competition: Competition } | { ok: false; error: string; issues?: string[] }> {
  let raw = file;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'The file is not valid JSON.' };
    }
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'The file is not a season export.' };
  const header = raw as { format?: unknown; version?: unknown };
  if (header.format !== SEASON_FORMAT) return { ok: false, error: 'The file is not a season export (format must be "mi-season").' };
  if (header.version !== SEASON_VERSION) return { ok: false, error: `Unsupported season file version (expected ${SEASON_VERSION}).` };

  const slug = slugSchema.safeParse(opts.newSlug);
  if (!slug.success) return { ok: false, error: slug.error.issues[0]?.message ?? 'Invalid slug', issues: formatIssues(slug.error, 'newSlug.') };

  const parsed = seasonFileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'The season file did not pass validation.', issues: formatIssues(parsed.error) };
  }
  const data = parsed.data;

  // Entries must still satisfy the same rules as hand-entered ones.
  const entryIssues: string[] = [];
  const cleanBoards = data.boards.map((b, bi) => ({
    ...b,
    entries: b.entries.flatMap((e, ei) => {
      const r = entryInputSchema.safeParse(e);
      if (!r.success) {
        entryIssues.push(...formatIssues(r.error, `boards.${bi}.entries.${ei}.`));
        return [];
      }
      return [r.data];
    }),
  }));
  if (entryIssues.length) return { ok: false, error: 'Some leaderboard entries are invalid.', issues: entryIssues };

  const title = (opts.newTitle?.trim() || data.competition.title).slice(0, 120);
  if (title.length < 3) return { ok: false, error: 'Title must be at least 3 characters' };
  if (await getCompetitionBySlug(db, slug.data)) return { ok: false, error: 'Slug already in use' };

  // Rows inserted in one transaction share now(); give them increasing timestamps so order survives.
  const base = Date.now() - 1000 * 60 * 60;
  let tick = 0;
  const nextTs = () => new Date(base + tick++);

  try {
    const competition = await db.transaction(async (tx) => {
      const [comp] = await tx
        .insert(competitions)
        .values({
          slug: slug.data,
          title,
          tagline: data.competition.tagline,
          startsOn: data.competition.startsOn,
          endsOn: data.competition.endsOn,
          currency: data.competition.currency,
        })
        .returning();
      if (!comp) throw new Error('Insert failed');

      // Always create all five pages; missing kinds get the template body.
      const bodies = new Map(data.pages.map((p) => [p.kind, p.bodyMd]));
      for (const kind of PAGE_KINDS) {
        const body = bodies.get(kind) ?? templatePageBody(kind, title);
        const [page] = await tx
          .insert(pages)
          .values({ competitionId: comp.id, kind, bodyMd: body, currentRevision: 1, updatedBy: opts.actorEmail })
          .returning({ id: pages.id });
        await tx.insert(pageRevisions).values({
          pageId: page!.id,
          revision: 1,
          bodyMd: body,
          note: `Imported from ${data.competition.slug}`,
          createdBy: opts.actorEmail,
        });
      }

      for (const b of cleanBoards) {
        const [board] = await tx
          .insert(boards)
          .values({
            competitionId: comp.id,
            slug: b.slug,
            title: b.title,
            objective: b.objective,
            unit: b.unit,
            direction: b.direction,
            target: b.target,
            period: b.period,
            source: b.source,
            decimals: b.decimals,
            position: b.position,
            createdAt: nextTs(),
          })
          .returning({ id: boards.id });
        if (b.source === 'manual' && b.entries.length) {
          await tx.insert(boardEntries).values(
            b.entries.map((e) => ({
              boardId: board!.id,
              label: e.label,
              value: e.value,
              entryDate: e.entryDate,
              sourceNote: e.sourceNote,
              evidenceUrl: e.evidenceUrl,
              example: e.example,
              createdAt: nextTs(),
            })),
          );
        }
      }

      if (data.ledgerMonths.length) {
        await tx.insert(ledgerMonths).values(
          data.ledgerMonths.map((m) => ({
            competitionId: comp.id,
            month: `${m.month}-01`,
            revenueMinor: m.revenueMinor,
            payingCustomers: m.payingCustomers,
            invoicesRaised: m.invoicesRaised,
            invoicesPaid: m.invoicesPaid,
            hostingMinor: m.hostingMinor,
            speechMinor: m.speechMinor,
            aiUsageMinor: m.aiUsageMinor,
            otherMinor: m.otherMinor,
            note: m.note,
            sharedPublicly: m.sharedPublicly,
          })),
        );
      }

      if (data.resources.length) {
        await tx.insert(resources).values(
          data.resources.map((r) => ({
            competitionId: comp.id,
            name: r.name,
            kind: r.kind,
            url: r.url,
            usedFor: r.usedFor,
            notes: r.notes,
            position: r.position,
            createdAt: nextTs(),
          })),
        );
      }

      for (const t of data.threads) {
        const created = new Date(t.createdAt);
        const lastReply = t.replies.reduce((max, r) => Math.max(max, Date.parse(r.createdAt)), created.getTime());
        const [thread] = await tx
          .insert(threads)
          .values({
            competitionId: comp.id,
            title: t.title,
            tag: t.tag,
            bodyMd: t.bodyMd,
            authorName: t.authorName,
            createdAt: created,
            lastActivityAt: new Date(lastReply),
          })
          .returning({ id: threads.id });
        if (t.replies.length) {
          await tx.insert(replies).values(
            t.replies.map((r) => ({
              threadId: thread!.id,
              authorType: r.authorType,
              authorName: r.authorName,
              bodyMd: r.bodyMd,
              agentSource: r.agentSource,
              agentPayload: r.agentPayload,
              model: r.model,
              isMock: r.isMock,
              hidden: r.hidden,
              hiddenAt: r.hidden ? new Date() : null,
              createdAt: new Date(r.createdAt),
            })),
          );
        }
      }
      return comp;
    });
    return { ok: true, competition };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: 'Slug already in use' };
    console.error('[importSeason] failed:', (err as Error).message);
    return { ok: false, error: 'Import failed. Nothing was saved.' };
  }
}
