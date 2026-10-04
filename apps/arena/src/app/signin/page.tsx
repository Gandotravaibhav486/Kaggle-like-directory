import { Card } from '@mi/ui';
import { SignInForm } from './sign-in-form';

export default function SignInPage() {
  return (
    <main id="content" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card title="Sign in" className="w-full">
        <p className="mb-4 text-small text-fg-secondary">
          Enter your email and we will send you a magic link. Only the owner can edit this site;
          everyone else browses as a visitor.
        </p>
        <SignInForm />
      </Card>
    </main>
  );
}
