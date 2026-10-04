import { Card } from '@mi/ui';
import { createThread } from '@/app/actions/discussion';
import { NewThreadForm } from './new-thread-form';

export default async function NewThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const action = createThread.bind(null, slug);

  return (
    <div className="mx-auto max-w-2xl">
      <Card title="New topic">
        <NewThreadForm action={action} slug={slug} />
      </Card>
    </div>
  );
}
