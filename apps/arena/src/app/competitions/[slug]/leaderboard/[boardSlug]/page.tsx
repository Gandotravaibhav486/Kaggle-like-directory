import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge, Card, LinkButton, Notice, Num, ProgressBar, ScrollTable } from '@mi/ui';
import { getBoardView, getCompetitionBySlug, getBoardBySlug, type EntryLike } from '@mi/db/queries';
import { gapToTarget, type Ranked } from '@mi/db/domain';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { AddEntryForm, EditEntryForm } from '@/components/entry-form';
import { DeleteEntryButton } from '@/components/delete-entry-button';
import { InlineDisclosure } from '@/components/inline-disclosure';

function rankLabel(ranked: Ranked<EntryLike>[], index: number): string {
  const row = ranked[index];
  if (!row || row.rank === null) return '—';
  const tied = ranked.filter((r) => r.rank === row.rank).length;
  return tied > 1 ? `${row.rank}=` : String(row.rank);
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string; boardSlug: string }>;
}) {
  const { slug, boardSlug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();
  const board = await getBoardBySlug(db, competition.id, boardSlug);
  if (!board) notFound();

  const [view, viewer] = await Promise.all([getBoardView(db, competition, board), getViewer()]);
  const isLedgerBoard = board.source === 'ledger_revenue';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold text-fg">{board.title}</h1>
          <p className="text-small text-fg-secondary">{board.objective}</p>
          <p className="mt-1 text-micro text-fg-muted">
            {board.direction === 'lower' ? 'Lower is better' : 'Higher is better'} · {board.period}
          </p>
        </div>
        {viewer.isOwner && !isLedgerBoard && (
          <LinkButton href={`/competitions/${slug}/leaderboard/${boardSlug}/edit`} variant="secondary" size="sm">
            Edit board
          </LinkButton>
        )}
      </div>

      {isLedgerBoard && (
        <div className="mb-4">
          <Notice tone="info">
            Derived from months the owner shared publicly. Shows revenue and paying customers only.
          </Notice>
        </div>
      )}

      <div className="mb-6">
        <ProgressBar value={view.progress} label={`${board.title} progress to target`} />
      </div>

      <ScrollTable caption={`${board.title} leaderboard`} data-testid="leaderboard-table">
        <thead>
          <tr className="bg-surface-sunken text-left text-micro text-fg-muted">
            <th scope="col" className="px-3 py-2">Rank</th>
            <th scope="col" className="px-3 py-2">Entry</th>
            <th scope="col" className="px-3 py-2 text-right">Value</th>
            <th scope="col" className="px-3 py-2 text-right">Gap to target</th>
            <th scope="col" className="px-3 py-2">Date</th>
            <th scope="col" className="px-3 py-2">Source</th>
            <th scope="col" className="px-3 py-2">Evidence</th>
            {viewer.isOwner && !isLedgerBoard && <th scope="col" className="px-3 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {view.ranked.map((r, i) => (
            <tr
              key={r.entry.id}
              data-testid="leaderboard-row"
              data-rank={r.rank ?? ''}
              className="border-t border-border"
            >
              <td className="num px-3 py-2 tnum">{r.eligible ? rankLabel(view.ranked, i) : 'Unranked'}</td>
              <th scope="row" className="px-3 py-2 text-left font-normal">
                {r.entry.label} {r.entry.example && <Badge variant="example" />}
                {!r.eligible && (
                  <span className="block text-micro text-fg-muted">
                    Unranked: needs date and source
                  </span>
                )}
              </th>
              <td className="num px-3 py-2 text-right tnum">
                <Num value={r.entry.value} decimals={board.decimals} unit={board.unit} />
              </td>
              <td className="num px-3 py-2 text-right tnum">
                <Num
                  value={r.eligible ? gapToTarget(r.entry.value, board.target, board.direction) : null}
                  decimals={board.decimals}
                  signed
                />
              </td>
              <td className="num px-3 py-2 tnum">{r.entry.entryDate ?? '—'}</td>
              <td className="px-3 py-2 text-small">{r.entry.sourceNote ?? '—'}</td>
              <td className="px-3 py-2 text-small">
                {r.entry.evidenceUrl ? (
                  <a
                    href={r.entry.evidenceUrl}
                    rel="nofollow ugc noopener noreferrer"
                    target="_blank"
                    className="text-accent underline underline-offset-[3px]"
                  >
                    Link
                  </a>
                ) : (
                  '—'
                )}
              </td>
              {viewer.isOwner && !isLedgerBoard && (
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <InlineDisclosure label="Edit">
                      <EditEntryForm slug={slug} boardSlug={boardSlug} entry={r.entry} />
                    </InlineDisclosure>
                    <DeleteEntryButton slug={slug} boardSlug={boardSlug} entryId={r.entry.id} />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </ScrollTable>

      {viewer.isOwner && !isLedgerBoard && (
        <Card title="Add entry" className="mt-6 max-w-xl">
          <AddEntryForm slug={slug} boardSlug={boardSlug} boardId={board.id} />
        </Card>
      )}

      <p className="mt-6">
        <Link href={`/competitions/${slug}/leaderboard`} className="text-accent underline underline-offset-[3px]">
          Back to all boards
        </Link>
      </p>
    </div>
  );
}
