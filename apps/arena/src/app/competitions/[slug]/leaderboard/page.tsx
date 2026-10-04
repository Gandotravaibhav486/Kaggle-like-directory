import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge, Card, EmptyState, LinkButton, Num, ProgressBar } from '@mi/ui';
import { getBoardView, getCompetitionBySlug, listBoards } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { RemoveExamplesButton } from '@/components/remove-examples-button';

export default async function LeaderboardIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const [boards, viewer] = await Promise.all([listBoards(db, competition.id), getViewer()]);
  const views = await Promise.all(boards.map((b) => getBoardView(db, competition, b)));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-semibold text-fg">Leaderboard</h1>
        {viewer.isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <RemoveExamplesButton slug={slug} />
            <LinkButton href={`/competitions/${slug}/leaderboard/new`} size="sm">
              New board
            </LinkButton>
          </div>
        )}
      </div>

      {views.length === 0 ? (
        <EmptyState title="No boards yet">The owner has not added a board for this season.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {views.map(({ board, best, gap, progress }) => (
            <Card key={board.id} title={board.title}>
              <p className="text-small text-fg-secondary">{board.objective}</p>
              <p className="mt-1 text-micro text-fg-muted">
                {board.direction === 'lower' ? 'Lower is better' : 'Higher is better'} · {board.period}
              </p>
              <p className="mt-3 text-num-lg">
                <Num value={best?.value ?? null} decimals={board.decimals} unit={board.unit} />
                {best?.example && <Badge variant="example" />}
              </p>
              {board.target !== null && (
                <p className="mt-1 text-small text-fg-muted">
                  Gap to target: <Num value={gap} decimals={board.decimals} unit={board.unit} signed />
                </p>
              )}
              <div className="mt-3">
                <ProgressBar value={progress} label={`${board.title} progress`} />
              </div>
              <p className="mt-4">
                <Link
                  href={`/competitions/${slug}/leaderboard/${board.slug}`}
                  className="text-accent underline underline-offset-[3px]"
                >
                  View board
                </Link>
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
