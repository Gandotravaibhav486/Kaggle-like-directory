'use server';

import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';

export async function requestMagicLink(_prev: unknown, formData: FormData): Promise<{ ok: boolean }> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false };
  await signIn('email', { email, redirect: false, redirectTo: '/' });
  redirect('/signin/check-email');
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
