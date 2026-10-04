import { ThemeToggle } from '../client/theme-toggle';
import { Badge } from './badge';

export interface SiteHeaderViewer {
  signedIn: boolean;
  email: string | null;
  isOwner: boolean;
}

export interface SiteHeaderNavItem {
  href: string;
  label: string;
  external?: boolean;
}

export interface SiteHeaderProps {
  app: 'arena' | 'lab';
  slug: string;
  arenaUrl: string;
  labUrl: string;
  nav: SiteHeaderNavItem[];
  viewer: SiteHeaderViewer;
  signInHref: string;
  signOutAction?: () => Promise<void>;
}

export function SiteHeader({ app, slug, arenaUrl, labUrl, nav, viewer, signInHref, signOutAction }: SiteHeaderProps) {
  const arenaHref = `${arenaUrl}/competitions/${slug}/overview`;
  const labHref = `${labUrl}/competitions/${slug}/discussion`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <a
        href="#content"
        className="fixed left-4 top-2 z-50 -translate-y-20 rounded-md bg-surface px-3 py-2 text-small shadow-pop focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
        <span className="inline-flex items-center gap-2 text-small font-semibold text-fg md:text-body">
          <span
            className={
              app === 'arena'
                ? 'grid size-6 place-items-center rounded-md bg-accent text-accent-fg num text-[11px] font-semibold md:size-7'
                : 'grid size-6 place-items-center rounded-md border-[1.5px] border-accent text-accent num text-[11px] font-semibold md:size-7'
            }
          >
            MI
          </span>
          <span className="hidden text-fg-secondary font-medium sm:inline">MockInterview</span>
          <span className="hidden text-fg-muted sm:inline">/</span>
          <span>{app === 'arena' ? 'Arena' : 'Lab'}</span>
        </span>

        <nav aria-label="Site" className="inline-flex rounded-md border border-border bg-surface-sunken p-0.5">
          <a
            href={arenaHref}
            aria-current={app === 'arena' ? 'page' : undefined}
            data-testid="cross-site-link"
            className={
              app === 'arena'
                ? 'inline-flex min-h-9 items-center gap-1.5 rounded-[5px] bg-surface px-3 text-small font-medium text-fg shadow-card dark:bg-surface-raised'
                : 'inline-flex min-h-9 items-center gap-1.5 rounded-[5px] px-3 text-small font-medium text-fg-secondary hover:text-fg'
            }
          >
            <span aria-hidden="true" className="size-2 rounded-[2px] bg-accent" />
            Arena
          </a>
          <a
            href={labHref}
            aria-current={app === 'lab' ? 'page' : undefined}
            data-testid="cross-site-link"
            className={
              app === 'lab'
                ? 'inline-flex min-h-9 items-center gap-1.5 rounded-[5px] bg-surface px-3 text-small font-medium text-fg shadow-card dark:bg-surface-raised'
                : 'inline-flex min-h-9 items-center gap-1.5 rounded-[5px] px-3 text-small font-medium text-fg-secondary hover:text-fg'
            }
          >
            <span aria-hidden="true" className="size-2 rounded-[2px] border border-accent" />
            Lab
          </a>
        </nav>

        <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="inline-flex min-h-9 items-center rounded-md px-2.5 text-small font-medium text-fg-secondary hover:bg-surface-sunken hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        {viewer.isOwner && (
          <span data-testid="owner-badge">
            <Badge variant="owner">Owner</Badge>
          </span>
        )}

        {viewer.signedIn ? (
          signOutAction ? (
            <form action={signOutAction}>
              <button type="submit" className="inline-flex min-h-9 items-center px-2.5 text-small font-medium text-fg-secondary hover:text-fg">
                Sign out
              </button>
            </form>
          ) : null
        ) : (
          <a href={signInHref} className="inline-flex min-h-9 items-center px-2.5 text-small font-medium text-fg-secondary hover:text-fg">
            Sign in
          </a>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
