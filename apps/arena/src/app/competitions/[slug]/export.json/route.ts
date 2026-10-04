import { notFound } from 'next/navigation';
import { exportSeason } from '@mi/db/season';
import { getCompetitionBySlug } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const viewer = await getViewer();
  if (!viewer.isOwner) notFound();

  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const file = await exportSeason(db, competition.id);

  return new Response(JSON.stringify(file, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-season.json"`,
    },
  });
}
