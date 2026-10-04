import Link from 'next/link';
import { Card, Notice } from '@mi/ui';
import { devMagicLinkEnabled } from '@mi/auth';

export default function CheckEmailPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <Card title="Check your email">
        <Notice tone="info">We sent a sign-in link to your email address. Open it on this device to continue.</Notice>
        {devMagicLinkEnabled() && (
          <p className="mt-4 text-small text-fg-secondary">
            Development mode:{' '}
            <Link className="text-accent underline underline-offset-2" href="/dev/magic-link">
              view the latest link
            </Link>
            .
          </p>
        )}
      </Card>
    </div>
  );
}
