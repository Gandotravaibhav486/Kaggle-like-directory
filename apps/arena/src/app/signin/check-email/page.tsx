import Link from 'next/link';
import { Card } from '@mi/ui';
import { devMagicLinkEnabled } from '@mi/auth';

export default function CheckEmailPage() {
  return (
    <main id="content" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card title="Check your email" className="w-full">
        <p className="text-small text-fg-secondary">
          If that address is valid, a sign-in link is on its way.
        </p>
        {devMagicLinkEnabled() && (
          <p className="mt-3 text-small text-fg-secondary">
            Development mode:{' '}
            <Link href="/dev/magic-link" className="text-accent underline underline-offset-[3px]">
              view the magic link
            </Link>
            .
          </p>
        )}
      </Card>
    </main>
  );
}
