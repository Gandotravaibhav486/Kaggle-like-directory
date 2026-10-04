import { Card, OwnerOnly } from '@mi/ui';
import { getViewer } from '@/lib/guards';
import { CreateBoardForm } from '@/components/board-form';

export default async function NewBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer.isOwner) return <OwnerOnly signInHref="/signin" />;

  return (
    <Card title="New board" className="max-w-xl">
      <CreateBoardForm slug={slug} />
    </Card>
  );
}
