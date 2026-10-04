import { notFound } from 'next/navigation';
import { Badge, EmptyState, ScrollTable } from '@mi/ui';
import { getCompetitionBySlug, listResources } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { ResourceRowActions } from './resource-row-actions';
import { ResourceFormDialog } from './resource-form';

export default async function DataPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const [resources, viewer] = await Promise.all([listResources(db, competition.id), getViewer()]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-semibold text-fg">Data and resources</h1>
        {viewer.isOwner && <ResourceFormDialog slug={slug} />}
      </div>

      {resources.length === 0 ? (
        <EmptyState title="No resources yet" />
      ) : (
        <ScrollTable caption="Data and resources catalogue" data-testid="data-table">
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Name</th>
              <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Kind</th>
              <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Used for</th>
              <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Notes (limits, licence, cost)</th>
              <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Link</th>
              {viewer.isOwner && <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} data-testid="data-row" className="border-t border-border">
                <td className="px-3 py-2.5 font-medium text-fg">{r.name}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="tag">{r.kind}</Badge>
                </td>
                <td className="px-3 py-2.5 text-fg-secondary">{r.usedFor}</td>
                <td className="px-3 py-2.5 text-fg-secondary">{r.notes}</td>
                <td className="px-3 py-2.5">
                  {r.url ? (
                    <a className="text-accent underline underline-offset-2" href={r.url} target="_blank" rel="noopener noreferrer">
                      Visit
                    </a>
                  ) : (
                    <span className="text-fg-muted">—</span>
                  )}
                </td>
                {viewer.isOwner && (
                  <td className="px-3 py-2.5">
                    <ResourceRowActions slug={slug} resource={r} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )}
    </div>
  );
}
