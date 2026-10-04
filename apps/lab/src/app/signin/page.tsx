import { Card } from '@mi/ui';
import { requestMagicLink } from '@/app/actions/auth';
import { SignInForm } from './sign-in-form';

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <Card title="Sign in">
        <p className="mb-4 text-small text-fg-secondary">
          Enter your email and we will send you a magic link. No password is needed.
        </p>
        <SignInForm action={requestMagicLink} />
      </Card>
    </div>
  );
}
