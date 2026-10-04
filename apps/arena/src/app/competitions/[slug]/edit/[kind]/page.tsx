import { notFound } from 'next/navigation';
import { OwnerOnly } from '@mi/ui';
import { PAGE_KINDS, type PageKind } from '@mi/db/domain';
import { getCompetitionBySlug, getPage } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { PageEditForm } from '@/components/page-edit-form';

function isPageKind(v: string): v is PageKind {
  return (PAGE_KINDS as readonly string[]).includes(v);
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string; kind: string }>;
}) {
  const { slug, kind } = await params;
  if (!isPageKind(kind)) notFound();

  const viewer = await getViewer();
  if (!viewer.isOwner) {
    return <OwnerOnly signInHref="/signin" />;
  }

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();
  const page = await getPage(db, competition.id, kind);
  if (!page) notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-4 text-h1 font-semibold text-fg">Edit {kind}</h1>
      <PageEditForm slug={slug} kind={kind} initialValue={page.bodyMd} />
    </div>
  );
}
