import { notFound } from 'next/navigation';
import { pipelineToCsv } from '@mi/db/domain';
import { getCompetitionBySlug, listProspects } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const viewer = await getViewer();
  if (!viewer.isOwner) notFound();

  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const prospects = await listProspects(db, competition.id);
  // The byte-order mark makes Excel read the file as UTF-8, so non-ASCII names survive.
  const csv = '﻿' + pipelineToCsv(prospects);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-pipeline.csv"`,
    },
  });
}
