import { notFound } from 'next/navigation';
import { CompetitionHero, SiteHeader } from '@mi/ui';
import { getCompetitionBySlug, listCompetitions } from '@mi/db/queries';
import { db } from '@/lib/db';
import { buildHeaderProps } from '@/lib/header';
import { getViewer } from '@/lib/guards';
import { LAB_URL } from '@/lib/env';
import { ActiveSubNav } from '@/components/active-sub-nav';
import { SeasonSwitcher } from '@/components/season-switcher';

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const [headerProps, viewer, seasons] = await Promise.all([
    buildHeaderProps(slug),
    getViewer(),
    listCompetitions(db),
  ]);

  const tabs = [
    { href: `/competitions/${slug}/overview`, label: 'Overview' },
    { href: `/competitions/${slug}/description`, label: 'Description' },
    { href: `/competitions/${slug}/evaluation`, label: 'Evaluation' },
    { href: `/competitions/${slug}/rules`, label: 'Rules' },
    { href: `/competitions/${slug}/timeline`, label: 'Timeline' },
    { href: `/competitions/${slug}/leaderboard`, label: 'Leaderboard' },
    ...(viewer.isOwner ? [{ href: `/competitions/${slug}/ledger`, label: 'Ledger' }] : []),
    { href: `${LAB_URL}/competitions/${slug}/discussion`, label: 'Discussion ↗', external: true },
    { href: `${LAB_URL}/competitions/${slug}/data`, label: 'Data ↗', external: true },
  ];

  return (
    <>
      <SiteHeader {...headerProps} />
      <CompetitionHero
        title={competition.title}
        tagline={competition.tagline}
        startsOn={competition.startsOn}
        endsOn={competition.endsOn}
        badge={competition.status === 'archived' ? 'Archived' : undefined}
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {seasons.length > 1 && (
          <div className="pt-3">
            <SeasonSwitcher slug={slug} seasons={seasons} />
          </div>
        )}
        <ActiveSubNav label="Competition" items={tabs} />
      </div>
      <main id="content" className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">{children}</main>
    </>
  );
}
