import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { CompetitionHero, SubNav } from '@mi/ui';
import { getCompetitionBySlug } from '@mi/db/queries';
import { db } from '@/lib/db';

const ARENA_URL = process.env.ARENA_URL ?? 'http://localhost:3000';

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const base = `/competitions/${slug}`;
  const items = [
    { href: `${base}/discussion`, label: 'Discussion', active: false },
    { href: `${base}/data`, label: 'Data', active: false },
    { href: `${base}/agents`, label: 'Agents', active: false },
    { href: `${ARENA_URL}${base}/overview`, label: 'Overview', active: false, external: true },
    { href: `${ARENA_URL}${base}/leaderboard`, label: 'Leaderboard', active: false, external: true },
  ];

  return (
    <div>
      <CompetitionHero
        title={competition.title}
        tagline={competition.tagline}
        startsOn={competition.startsOn}
        endsOn={competition.endsOn}
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SubNav label="Lab sections" items={items} />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
