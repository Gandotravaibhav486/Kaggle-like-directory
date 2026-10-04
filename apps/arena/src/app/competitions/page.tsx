import Link from 'next/link';
import { Card, LinkButton, SiteHeader } from '@mi/ui';
import { listCompetitions } from '@mi/db/queries';
import { db } from '@/lib/db';
import { buildHeaderProps } from '@/lib/header';
import { getViewer } from '@/lib/guards';
import { DEFAULT_SLUG } from '@/lib/env';

export default async function CompetitionsPage() {
  const [competitions, viewer, headerProps] = await Promise.all([
    listCompetitions(db),
    getViewer(),
    buildHeaderProps(DEFAULT_SLUG),
  ]);

  return (
    <>
      <SiteHeader {...headerProps} />
      <main id="content" className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h1 font-semibold text-fg">Seasons</h1>
          {viewer.isOwner && (
            <div className="flex gap-2">
              <LinkButton href="/seasons/import" variant="secondary">
                Import season
              </LinkButton>
              <LinkButton href="/seasons/new">New season</LinkButton>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((c) => (
            <Card key={c.id} title={c.title}>
              <p className="text-small text-fg-secondary">{c.tagline}</p>
              <p className="mt-3">
                <Link href={`/competitions/${c.slug}/overview`} className="text-accent underline underline-offset-[3px]">
                  Open {c.slug}
                </Link>
              </p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
