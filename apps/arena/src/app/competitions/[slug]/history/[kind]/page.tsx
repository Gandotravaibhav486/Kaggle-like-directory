import { notFound } from 'next/navigation';
import { Badge, Card, MarkdownView, OwnerOnly } from '@mi/ui';
import { PAGE_KINDS, type PageKind } from '@mi/db/domain';
import { getCompetitionBySlug, getPage, getPageRevision, listPageRevisions } from '@mi/db/queries';
import { formatDate as uiFormatDate } from '@mi/ui/format';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { RestoreForm } from '@/components/restore-button';

function isPageKind(v: string): v is PageKind {
  return (PAGE_KINDS as readonly string[]).includes(v);
}

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; kind: string }>;
  searchParams: Promise<{ rev?: string }>;
}) {
  const { slug, kind } = await params;
  const { rev } = await searchParams;
  if (!isPageKind(kind)) notFound();

  const viewer = await getViewer();
  if (!viewer.isOwner) {
    return <OwnerOnly signInHref="/signin" title="History is owner only" />;
  }

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();
  const page = await getPage(db, competition.id, kind);
  if (!page) notFound();

  const revisions = await listPageRevisions(db, page.id);
  const selectedRevision = rev ? Number(rev) : page.currentRevision;
  const viewing = await getPageRevision(db, page.id, selectedRevision);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
      <div>
        <h1 className="mb-4 text-h1 font-semibold text-fg">History: {kind}</h1>
        {viewing && (
          <Card title={`Revision #${viewing.revision}`}>
            <p className="mb-3 text-small text-fg-muted">
              {uiFormatDate(viewing.createdAt)}
              {viewing.restoredFromRevision ? ` · Restored from #${viewing.restoredFromRevision}` : ''}
            </p>
            <MarkdownView markdown={viewing.bodyMd} />
          </Card>
        )}
      </div>
      <aside className="mt-6 lg:mt-0">
        <Card title="Revisions">
          <ul data-testid="revision-list" className="divide-y divide-border">
            {revisions.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/competitions/${slug}/history/${kind}?rev=${r.revision}`}
                    className="text-small font-medium text-fg underline-offset-[3px] hover:underline"
                  >
                    #{r.revision}
                  </a>
                  {r.revision === page.currentRevision && <Badge variant="neutral">Current</Badge>}
                </div>
                <p className="num text-micro text-fg-muted">{uiFormatDate(r.createdAt)}</p>
                {r.restoredFromRevision && (
                  <p className="text-micro text-fg-muted">Restored from #{r.restoredFromRevision}</p>
                )}
                {r.revision !== page.currentRevision && (
                  <div className="mt-2">
                    <RestoreForm slug={slug} kind={kind} revision={r.revision} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}
