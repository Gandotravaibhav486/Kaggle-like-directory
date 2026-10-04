import { notFound } from 'next/navigation';
import { ledgerToCsv } from '@mi/db/domain';
import { getCompetitionBySlug, listLedgerMonths } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const viewer = await getViewer();
  if (!viewer.isOwner) notFound();

  const { slug } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const months = await listLedgerMonths(db, competition.id);
  const csv = ledgerToCsv(months, competition.currency);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-ledger.csv"`,
    },
  });
}
