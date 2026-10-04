import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, EmptyState, LinkButton } from '@mi/ui';
import { formatDate } from '@mi/ui/format';
import { getCompetitionBySlug, listThreads } from '@mi/db/queries';
import { db } from '@/lib/db';

export default async function DiscussionListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const threads = await listThreads(db, competition.id);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-semibold text-fg">Discussion</h1>
        <LinkButton href={`/competitions/${slug}/discussion/new`}>New topic</LinkButton>
      </div>

      {threads.length === 0 ? (
        <EmptyState title="No topics yet">Start the first discussion for this season.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {threads.map((t) => (
            <li key={t.id} data-testid="thread-list-item">
              <Link
                href={`/competitions/${slug}/discussion/${t.id}`}
                className="flex flex-col gap-1.5 px-4 py-3.5 hover:bg-surface-sunken md:flex-row md:items-center md:justify-between md:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="tag">{t.tag}</Badge>
                    <span className="truncate font-medium text-fg">{t.title}</span>
                  </div>
                  <p className="mt-1 text-small text-fg-secondary">
                    by {t.authorName} · <time dateTime={new Date(t.createdAt).toISOString()}>{formatDate(t.createdAt)}</time>
                  </p>
                </div>
                <div className="shrink-0 text-small text-fg-muted">
                  <span className="num tnum">{t.replyCount}</span> {t.replyCount === 1 ? 'reply' : 'replies'}
                  <span className="mx-1.5">·</span>
                  last activity <time dateTime={new Date(t.lastActivityAt).toISOString()}>{formatDate(t.lastActivityAt)}</time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
