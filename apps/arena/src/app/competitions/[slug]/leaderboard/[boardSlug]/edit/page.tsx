import { notFound } from 'next/navigation';
import { Card, OwnerOnly } from '@mi/ui';
import { getBoardBySlug, getCompetitionBySlug } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { UpdateBoardForm } from '@/components/board-form';
import { DeleteBoardButton } from '@/components/delete-board-button';

export default async function EditBoardPage({
  params,
}: {
  params: Promise<{ slug: string; boardSlug: string }>;
}) {
  const { slug, boardSlug } = await params;
  const viewer = await getViewer();
  if (!viewer.isOwner) return <OwnerOnly signInHref="/signin" />;

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();
  const board = await getBoardBySlug(db, competition.id, boardSlug);
  if (!board) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <Card title="Board settings">
        <UpdateBoardForm slug={slug} board={board} />
      </Card>
      <Card title="Danger zone">
        <DeleteBoardButton slug={slug} boardId={board.id} />
      </Card>
    </div>
  );
}
