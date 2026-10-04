import { ContentPage } from '@/components/content-page';

export default async function RulesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContentPage slug={slug} kind="rules" />;
}
