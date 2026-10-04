import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { OWNER_EMAIL } from './env';

/**
 * Signs in on ONE app through the dev magic-link path (ARCHITECTURE §5, §8.2):
 * /signin -> fill email -> submit -> /dev/magic-link?email= -> click the link -> owner badge.
 * Sessions are per app: call it once per app the spec uses.
 */
export async function signInAs(page: Page, baseURL: string, email: string): Promise<void> {
  await page.goto(`${baseURL}/signin`);
  await page.getByLabel(/email/i).first().fill(email);
  await page
    .getByRole('button', { name: /sign in|send|email me|magic link|continue/i })
    .first()
    .click();
  await page.waitForURL(/\/signin\/check-email/, { timeout: 30_000 });
  await page.goto(`${baseURL}/dev/magic-link?email=${encodeURIComponent(email)}`);
  const link = page.getByTestId('dev-magic-link');
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  expect(href, 'dev magic link href').toBeTruthy();
  await link.click();
  await page.waitForLoadState('load');
}

export async function signInAsOwner(page: Page, baseURL: string): Promise<void> {
  await signInAs(page, baseURL, OWNER_EMAIL);
  await expect(page.getByTestId('owner-badge').first()).toBeVisible({ timeout: 15_000 });
}

/** A fresh, signed-out browser context (a visitor). Close it when done. */
export async function visitorContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext();
}

/** A fresh context already signed in as the owner on the given app(s). */
export async function ownerContext(browser: Browser, baseURLs: string[]): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const url of baseURLs) await signInAsOwner(page, url);
  return { context, page };
}
