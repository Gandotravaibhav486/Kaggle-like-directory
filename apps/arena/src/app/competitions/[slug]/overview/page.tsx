import { Badge, Card, EmptyState } from '@mi/ui';
import { listLatestThreads } from '@mi/db/queries';
import { db } from '@/lib/db';
import { ContentPage } from '@/components/content-page';
import { LAB_URL } from '@/lib/env';

export default async function OverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topics = await listLatestThreads(db, slug, 3);

  return (
    <ContentPage slug={slug} kind="overview">
      <Card title="From the lab" className="mt-6">
        {topics.length === 0 ? (
          <EmptyState title="No discussion yet">Topics started in the lab will show up here.</EmptyState>
        ) : (
          <ul className="divide-y divide-border" data-testid="latest-topics">
            {topics.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <a
                  href={`${LAB_URL}/competitions/${slug}/discussion/${t.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="cross-site-link"
                  className="text-body font-medium text-fg underline-offset-[3px] hover:underline"
                >
                  {t.title}
                </a>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="tag">{t.tag}</Badge>
                  <span className="num text-small text-fg-muted">{t.replyCount}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ContentPage>
  );
}
