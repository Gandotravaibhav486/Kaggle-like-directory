import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { signInAsOwner } from './helpers/auth';
import { ARENA, DEFAULT_SLUG, LAB, THEMES, VIEWPORTS, type Theme, type ViewportKey } from './helpers/env';
import { forceTheme } from './helpers/theme';

// Visual QA skeleton (Worker A). Captures full-page screenshots of the main routes at
// 1440x900 and 390x844 in light and dark into docs/qa/screenshots/<viewport>/<theme>/<route>.png.
// QA extends ROUTES as pages land. Tagged @screens so the functional projects skip it.

const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'qa', 'screenshots');
const C = `/competitions/${DEFAULT_SLUG}`;

interface Route {
  /** file name (no extension) */
  name: string;
  app: 'arena' | 'lab';
  path: string | ((page: Page) => Promise<string>);
  owner?: boolean;
}

/** Opens the discussion list and returns the path of the first thread. */
async function firstThreadPath(page: Page): Promise<string> {
  await page.goto(`${LAB}${C}/discussion`);
  const href = await page.getByTestId('thread-list-item').first().locator('a').first().getAttribute('href');
  if (!href) throw new Error('No thread link found on the discussion page');
  return href.startsWith('http') ? new URL(href).pathname : href;
}

const ROUTES: Route[] = [
  // arena, visitor
  { name: 'arena-competitions', app: 'arena', path: '/competitions' },
  { name: 'arena-overview', app: 'arena', path: `${C}/overview` },
  { name: 'arena-description', app: 'arena', path: `${C}/description` },
  { name: 'arena-evaluation', app: 'arena', path: `${C}/evaluation` },
  { name: 'arena-rules', app: 'arena', path: `${C}/rules` },
  { name: 'arena-timeline', app: 'arena', path: `${C}/timeline` },
  { name: 'arena-leaderboard', app: 'arena', path: `${C}/leaderboard` },
  { name: 'arena-board-scoring-stability', app: 'arena', path: `${C}/leaderboard/scoring-stability` },
  { name: 'arena-board-reach-by-channel', app: 'arena', path: `${C}/leaderboard/reach-by-channel` },
  { name: 'arena-board-monthly-revenue', app: 'arena', path: `${C}/leaderboard/monthly-revenue` },
  { name: 'arena-ledger-visitor', app: 'arena', path: `${C}/ledger` },
  { name: 'arena-signin', app: 'arena', path: '/signin' },
  // arena, owner
  { name: 'arena-ledger-owner', app: 'arena', path: `${C}/ledger`, owner: true },
  { name: 'arena-edit-description', app: 'arena', path: `${C}/edit/description`, owner: true },
  { name: 'arena-history-description', app: 'arena', path: `${C}/history/description`, owner: true },
  { name: 'arena-leaderboard-owner', app: 'arena', path: `${C}/leaderboard`, owner: true },
  { name: 'arena-season-new', app: 'arena', path: '/seasons/new', owner: true },
  { name: 'arena-season-import', app: 'arena', path: '/seasons/import', owner: true },
  // lab, visitor
  { name: 'lab-discussion', app: 'lab', path: `${C}/discussion` },
  { name: 'lab-thread', app: 'lab', path: firstThreadPath },
  { name: 'lab-new-topic', app: 'lab', path: `${C}/discussion/new` },
  { name: 'lab-data', app: 'lab', path: `${C}/data` },
  { name: 'lab-agents', app: 'lab', path: `${C}/agents` },
  // lab, owner
  { name: 'lab-agents-owner', app: 'lab', path: `${C}/agents`, owner: true },
  { name: 'lab-thread-owner', app: 'lab', path: firstThreadPath, owner: true },
];

async function newPage(browser: Browser, viewport: ViewportKey, theme: Theme, owner: boolean, app: 'arena' | 'lab') {
  const vp = VIEWPORTS[viewport];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: viewport === 'mobile' ? 2 : 1,
    isMobile: viewport === 'mobile',
    hasTouch: viewport === 'mobile',
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await forceTheme(page, theme);
  if (owner) await signInAsOwner(page, app === 'arena' ? ARENA : LAB);
  return { context, page };
}

for (const viewport of Object.keys(VIEWPORTS) as ViewportKey[]) {
  for (const theme of THEMES) {
    test.describe(`@screens ${VIEWPORTS[viewport].name} ${theme}`, () => {
      for (const route of ROUTES) {
        test(`${route.name}`, async ({ browser }) => {
          const { context, page } = await newPage(browser, viewport, theme, Boolean(route.owner), route.app);
          try {
            const base = route.app === 'arena' ? ARENA : LAB;
            const p = typeof route.path === 'string' ? route.path : await route.path(page);
            const res = await page.goto(`${base}${p}`);
            expect(res?.status(), `${route.name} HTTP status`).toBeLessThan(500);
            await page.waitForLoadState('networkidle');
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
            const dir = path.join(OUT_DIR, VIEWPORTS[viewport].name, theme);
            mkdirSync(dir, { recursive: true });
            await page.screenshot({ path: path.join(dir, `${route.name}.png`), fullPage: true, animations: 'disabled' });
            // DESIGN.md §7: nothing may scroll the page sideways.
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect.soft(overflow, `${route.name} horizontal overflow (px)`).toBeLessThanOrEqual(0);
          } finally {
            await context.close();
          }
        });
      }
    });
  }
}
