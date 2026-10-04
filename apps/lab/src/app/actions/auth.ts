'use server';

import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import type { ActionResult } from '@mi/db/domain';

export async function requestMagicLink(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { ok: false, fieldErrors: { email: ['Email is required'] } };
  }
  // next-auth's own post-signIn redirect does not reliably propagate when called
  // from inside a server action (same issue arena hit): disable it and redirect
  // ourselves so the client actually navigates to the check-email page.
  await signIn('email', { email, redirect: false, redirectTo: '/' });
  redirect('/signin/check-email');
}
