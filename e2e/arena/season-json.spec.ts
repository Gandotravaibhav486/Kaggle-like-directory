import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: season JSON export/import', () => {
  test('owner downloads export.json with the right shape, a visitor gets 404', async ({ page, browser }) => {
    await signInAsOwner(page, ARENA);
    const res = await page.request.get(`${ARENA}${C}/export.json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.format).toBe('mi-season');
    expect(body.version).toBe(1);
    expect(Array.isArray(body.pages)).toBe(true);
    expect(Array.isArray(body.boards)).toBe(true);

    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    const visitorRes = await visitorPage.request.get(`${ARENA}${C}/export.json`);
    expect(visitorRes.status()).toBe(404);
    await visitor.close();
  });

  test('importing with a new slug creates a season whose pages and boards render; duplicate slug and malformed JSON show errors', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);
    const res = await page.request.get(`${ARENA}${C}/export.json`);
    const json = await res.text();
    const newSlug = uniq('imported-season');

    await page.goto(`${ARENA}/seasons/import`);
    await page.getByLabel('Season JSON', { exact: true }).fill(json);
    await page.getByLabel('New slug').fill(newSlug);
    await page.getByRole('button', { name: 'Import season' }).click();
    await page.waitForURL(new RegExp(`/competitions/${newSlug}/overview`), { timeout: 15_000 });
    await expect(page.getByTestId('markdown-view')).toBeVisible();

    await page.goto(`${ARENA}/competitions/${newSlug}/leaderboard`);
    await expect(page.getByText(/Scoring stability|Reach by channel|Monthly revenue/).first()).toBeVisible();

    // Duplicate slug.
    await page.goto(`${ARENA}/seasons/import`);
    await page.getByLabel('Season JSON', { exact: true }).fill(json);
    await page.getByLabel('New slug').fill(newSlug);
    await page.getByRole('button', { name: 'Import season' }).click();
    await expect(page.getByTestId('form-error')).toBeVisible();

    // Malformed JSON.
    await page.goto(`${ARENA}/seasons/import`);
    await page.getByLabel('Season JSON', { exact: true }).fill('{ not json');
    await page.getByLabel('New slug').fill(uniq('bad-json'));
    await page.getByRole('button', { name: 'Import season' }).click();
    await expect(page.getByTestId('form-error')).toContainText('not valid JSON');
  });
});
