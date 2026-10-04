import { notFound } from 'next/navigation';
import { loadDevMagicLink } from '@mi/auth';
import { Card, Notice } from '@mi/ui';

export default async function DevMagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const view = await loadDevMagicLink(email ?? null);
  if (!view) notFound();

  return (
    <main id="content" className="mx-auto max-w-md px-4 py-10">
      <Notice tone="warning" title="Development only">
        This page only exists outside production, or with DEV_MAGIC_LINK=1 for automated tests.
        Never expose it on a public deployment.
      </Notice>
      <Card title="Magic link" className="mt-4">
        <p className="text-small text-fg-secondary">For {view.email || 'no address given'}</p>
        {view.link ? (
          <p className="mt-3">
            <a data-testid="dev-magic-link" href={view.link.url} className="text-accent underline underline-offset-[3px]">
              Sign in as {view.email}
            </a>
          </p>
        ) : (
          <p className="mt-3 text-small text-fg-muted">No magic link has been requested yet.</p>
        )}
      </Card>
    </main>
  );
}
