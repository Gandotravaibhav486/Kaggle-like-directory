import type { SiteHeaderProps } from '@mi/ui';
import { getViewer } from '@/lib/guards';
import { ARENA_URL, LAB_URL } from '@/lib/env';
import { signOutAction } from '@/app/actions/auth';

export async function buildHeaderProps(
  slug: string,
  nav: SiteHeaderProps['nav'] = [],
): Promise<SiteHeaderProps> {
  const viewer = await getViewer();
  return {
    app: 'arena',
    slug,
    arenaUrl: ARENA_URL,
    labUrl: LAB_URL,
    nav,
    viewer,
    signInHref: '/signin',
    signOutAction: viewer.signedIn ? signOutAction : undefined,
  };
}
