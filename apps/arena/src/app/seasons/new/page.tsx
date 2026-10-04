import { Card, OwnerOnly, SiteHeader } from '@mi/ui';
import { getViewer } from '@/lib/guards';
import { buildHeaderProps } from '@/lib/header';
import { DEFAULT_SLUG } from '@/lib/env';
import { NewSeasonForm } from './new-season-form';

export default async function NewSeasonPage() {
  const viewer = await getViewer();
  const headerProps = await buildHeaderProps(DEFAULT_SLUG);

  return (
    <>
      <SiteHeader {...headerProps} />
      <main id="content" className="mx-auto max-w-xl px-4 py-10">
        {viewer.isOwner ? (
          <Card title="New season">
            <NewSeasonForm />
          </Card>
        ) : (
          <OwnerOnly signInHref="/signin" />
        )}
      </main>
    </>
  );
}
