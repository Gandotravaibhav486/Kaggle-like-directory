import type { ReactNode } from 'react';
import { SiteHeader, ThemeScript } from '@mi/ui';
import { DEFAULT_COMPETITION_SLUG } from '@mi/db/domain';
import { sans, mono } from '@/fonts';
import { getViewer } from '@/lib/guards';
import { signOut } from '@/auth';
import './globals.css';

export const dynamic = 'force-dynamic';

const ARENA_URL = process.env.ARENA_URL ?? 'http://localhost:3000';
const LAB_URL = process.env.LAB_URL ?? 'http://localhost:3001';

async function signOutAction() {
  'use server';
  await signOut({ redirectTo: '/' });
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <SiteHeader
          app="lab"
          slug={DEFAULT_COMPETITION_SLUG}
          arenaUrl={ARENA_URL}
          labUrl={LAB_URL}
          nav={[]}
          viewer={{ signedIn: viewer.signedIn, email: viewer.email, isOwner: viewer.isOwner }}
          signInHref="/signin"
          signOutAction={viewer.signedIn ? signOutAction : undefined}
        />
        <main id="content" className="mx-auto min-h-[70vh] max-w-6xl px-4 pb-16 md:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
