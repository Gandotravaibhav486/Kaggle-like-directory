import { ContentPage } from '@/components/content-page';

export default async function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentPage slug={slug} kind="timeline" />;
}
