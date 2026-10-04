import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, LinkButton, MarkdownView } from '@mi/ui';
import { getCompetitionBySlug, getPage } from '@mi/db/queries';
import type { PageKind } from '@mi/db/domain';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';

const TITLES: Record<PageKind, string> = {
  overview: 'Overview',
  description: 'Description',
  evaluation: 'Evaluation',
  rules: 'Rules',
  timeline: 'Timeline',
};

export async function ContentPage({
  slug,
  kind,
  children,
}: {
  slug: string;
  kind: PageKind;
  children?: React.ReactNode;
}) {
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();
  const [page, viewer] = await Promise.all([getPage(db, competition.id, kind), getViewer()]);
  if (!page) notFound();

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
      <div className="max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h1 font-semibold text-fg">{TITLES[kind]}</h1>
          {viewer.isOwner && (
            <div className="flex gap-2">
              <LinkButton href={`/competitions/${slug}/history/${kind}`} variant="secondary" size="sm">
                History
              </LinkButton>
              <LinkButton href={`/competitions/${slug}/edit/${kind}`} size="sm">
                Edit
              </LinkButton>
            </div>
          )}
        </div>
        <Card>
          <MarkdownView markdown={page.bodyMd} />
        </Card>
        {children}
      </div>
      <aside className="mt-6 lg:mt-0">
        <Card title="Season">
          <p className="text-small text-fg-secondary">
            <Link href={`/competitions/${slug}/leaderboard`} className="text-accent underline underline-offset-[3px]">
              Leaderboard
            </Link>
          </p>
        </Card>
      </aside>
    </div>
  );
}
