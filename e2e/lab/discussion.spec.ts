import { expect, test } from '@playwright/test';
import { ARENA, DEFAULT_SLUG, LAB } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('lab discussion', () => {
  test('lists the 4 seeded topics', async ({ page }) => {
    await page.goto(`${LAB}${C}/discussion`);
    await expect(page.getByTestId('thread-list-item')).toHaveCount(4);
  });

  test('a visitor can create a topic and reply, with validation on a short title', async ({ page }) => {
    await page.goto(`${LAB}${C}/discussion/new`);

    // Too-short title is rejected.
    const visitorName = uniq('visitor');
    await page.getByLabel('Title').fill('Hi');
    await page.getByLabel('Tag').selectOption('product');
    await page.getByLabel('Your name').fill(visitorName);
    await page.getByLabel('Post').fill('Body text for the new topic.');
    await page.getByRole('button', { name: 'Post topic' }).click();
    await expect(page.getByText(/Title must be at least 5 characters/)).toBeVisible();

    // The server action's revalidation remounts the form (Next.js server-action refresh),
    // dropping prior keystrokes, so every field must be re-filled before the second submit.
    const title = uniq('New topic about growth');
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Tag').selectOption('product');
    await page.getByLabel('Your name').fill(visitorName);
    await page.getByLabel('Post').fill('Body text for the new topic.');
    await page.getByRole('button', { name: 'Post topic' }).click();

    await page.waitForURL(/\/discussion\/[a-f0-9-]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Reply as a visitor.
    const replyAuthor = uniq('replier');
    await page.getByLabel('Your name').fill(replyAuthor);
    await page.getByLabel('Reply').fill('A reply from a visitor.');
    await page.getByRole('button', { name: 'Post reply' }).click();
    // Scope to an actual reply card: the agent briefing textarea also echoes the thread's
    // replies verbatim, so an unscoped text locator matches both.
    await expect(page.getByTestId('reply').getByText('A reply from a visitor.')).toBeVisible();

    // Empty body is rejected.
    await page.getByLabel('Your name').fill(uniq('replier2'));
    await page.getByRole('button', { name: 'Post reply' }).click();
    await expect(page.getByTestId('field-error-bodyMd')).toBeVisible();
  });

  test('raw HTML in a reply body is not rendered as HTML', async ({ page }) => {
    await page.goto(`${LAB}${C}/discussion`);
    await page.getByTestId('thread-list-item').first().locator('a').first().click();

    await page.getByLabel('Your name').fill(uniq('html-tester'));
    const marker = uniq('marker');
    await page.getByLabel('Reply').fill(`<script>window.__xss_${marker}=1</script><img src=x onerror="window.__xss_${marker}=1">`);
    await page.getByRole('button', { name: 'Post reply' }).click();

    await expect(page.getByText(`<script>window.__xss_${marker}=1</script>`, { exact: false })).toBeVisible();
    const executed = await page.evaluate((m) => (window as unknown as Record<string, unknown>)[`__xss_${m}`], marker);
    expect(executed).toBeUndefined();
    expect(await page.locator('script', { hasText: marker }).count()).toBe(0);
  });

  test('arena overview lists the latest 3 lab topics and cross-links target the same slug', async ({ page }) => {
    await page.goto(`${ARENA}${C}/overview`);
    const latest = page.getByTestId('latest-topics');
    await expect(latest).toBeVisible();
    await expect(latest.getByRole('link').first()).toBeVisible();

    const crossLink = page.getByTestId('cross-site-link').filter({ hasText: 'Lab' });
    const href = await crossLink.first().getAttribute('href');
    expect(href).toContain(`/competitions/${DEFAULT_SLUG}/discussion`);
  });
});
