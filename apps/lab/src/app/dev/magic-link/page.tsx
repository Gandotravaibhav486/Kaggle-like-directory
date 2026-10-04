import { notFound } from 'next/navigation';
import { loadDevMagicLink } from '@mi/auth';
import { Card, Notice } from '@mi/ui';

export default async function DevMagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const view = await loadDevMagicLink(email);
  if (!view) notFound();

  return (
    <div className="mx-auto max-w-lg py-12">
      <Notice tone="warning" title="Development only">
        This page exposes magic links without email delivery. Never enable it on a public deployment.
      </Notice>
      <Card title={`Latest link for ${view.email}`} className="mt-4">
        {view.link ? (
          <a data-testid="dev-magic-link" className="text-accent underline underline-offset-2" href={view.link.url}>
            {view.link.url}
          </a>
        ) : (
          <p className="text-small text-fg-secondary">No link has been requested for this email yet.</p>
        )}
      </Card>
    </div>
  );
}
