import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb } from '@mi/db';
import { isOwnerEmail } from '@mi/db/domain';
import { latestDevMagicLink, recordDevMagicLink } from '@mi/db/queries';
import { accounts, sessions, users, verificationTokens } from '@mi/db/schema';
import NextAuth, { type DefaultSession, type NextAuthConfig, type NextAuthResult, type Session } from 'next-auth';
import type { EmailConfig } from 'next-auth/providers/email';

declare module 'next-auth' {
  interface Session {
    user: {
      isOwner: boolean;
    } & DefaultSession['user'];
  }
}

export type AppName = 'arena' | 'lab';

export interface Viewer {
  email: string | null;
  isOwner: boolean;
  signedIn: boolean;
}

export class ForbiddenError extends Error {
  constructor(message = 'Only the owner can do this.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export { isOwnerEmail };

/** The dev magic-link path: on outside production, or when DEV_MAGIC_LINK=1 (automated tests only). */
export function devMagicLinkEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.DEV_MAGIC_LINK === '1';
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

/** True when the configured OWNER_EMAIL matches (case-insensitive). */
export function isOwner(email: string | null | undefined): boolean {
  return isOwnerEmail(email, process.env.OWNER_EMAIL);
}

export function viewerFromSession(s: Session | null): Viewer {
  const email = s?.user?.email ?? null;
  return { email, isOwner: isOwner(email), signedIn: Boolean(s?.user) };
}

async function sendWithSmtp(to: string, url: string, host: string): Promise<void> {
  const nodemailer = await import('nodemailer');
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_PORT === '465',
    auth: user ? { user, pass: process.env.SMTP_PASSWORD ?? '' } : undefined,
  });
  const escapedUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const escapedHost = host.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}\n\n${url}\n\nIf you did not request this email you can ignore it.\n`,
    html: `<p>Sign in to <strong>${escapedHost}</strong></p><p><a href="${escapedUrl}">Sign in</a></p><p>If you did not request this email you can ignore it.</p>`,
  });
}

function emailProvider(app: AppName): EmailConfig {
  return {
    id: 'email',
    name: 'Email',
    type: 'email',
    maxAge: 60 * 60 * 24,
    async sendVerificationRequest({ identifier, url }) {
      const email = identifier.trim().toLowerCase();
      if (smtpConfigured()) {
        await sendWithSmtp(email, url, new URL(url).host);
        return;
      }
      if (devMagicLinkEnabled()) {
        console.log(`[magic-link] ${email} ${url}`);
        await recordDevMagicLink(getDb(), { email, url, app });
        return;
      }
      throw new Error('Email sign-in is not configured');
    },
  };
}

export function buildAuthConfig(opts: { app: AppName }): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: 'database' },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    pages: { signIn: '/signin', verifyRequest: '/signin/check-email', error: '/signin' },
    providers: [emailProvider(opts.app)],
    callbacks: {
      session({ session }) {
        if (session.user) session.user.isOwner = isOwner(session.user.email);
        return session;
      },
    },
  };
}

export type AuthInstance = Pick<NextAuthResult, 'handlers' | 'signIn' | 'signOut'> & {
  auth: () => Promise<Session | null>;
};

/**
 * Shared Auth.js factory. Config is resolved lazily per request, so env vars are read at
 * runtime (not at build time) and nothing touches the database on import.
 */
export function createAuth(opts: { app: AppName }): AuthInstance {
  const result = NextAuth(() => buildAuthConfig(opts));
  return {
    handlers: result.handlers,
    auth: () => result.auth() as Promise<Session | null>,
    signIn: result.signIn,
    signOut: result.signOut,
  };
}

/** Builds the per-app guards (apps re-export them from src/lib/guards.ts). */
export function createGuards(auth: () => Promise<Session | null>) {
  async function getViewer(): Promise<Viewer> {
    return viewerFromSession(await auth());
  }
  async function requireOwner(): Promise<Viewer> {
    const viewer = await getViewer();
    if (!viewer.isOwner) throw new ForbiddenError();
    return viewer;
  }
  return { getViewer, requireOwner };
}

export interface DevMagicLinkView {
  email: string;
  link: { url: string; createdAt: Date; app: string } | null;
}

/**
 * Data for the `/dev/magic-link` page. Returns null when the dev path is disabled
 * (the page should then call notFound()). email defaults to OWNER_EMAIL.
 */
export async function loadDevMagicLink(email?: string | null): Promise<DevMagicLinkView | null> {
  if (!devMagicLinkEnabled()) return null;
  const target = (email?.trim() || process.env.OWNER_EMAIL?.trim() || '').toLowerCase();
  if (!target) return { email: '', link: null };
  return { email: target, link: await latestDevMagicLink(getDb(), target) };
}
