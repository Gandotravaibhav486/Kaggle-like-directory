import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA } from '../helpers/env';
import { uniq } from '../helpers/unique';

test.describe('arena: end-to-end season flow (SPEC Done #2)', () => {
  test('new season, add a board, enter a ledger month, share it, and see the public revenue board change', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);

    const slug = uniq('season-flow');
    await page.goto(`${ARENA}/seasons/new`);
    await page.getByLabel('Slug').fill(slug);
    await page.getByLabel('Title').fill('Season flow season');
    await page.getByRole('button', { name: 'Create season' }).click();
    await page.waitForURL(new RegExp(`/competitions/${slug}/overview`), { timeout: 15_000 });

    const C = `/competitions/${slug}`;

    const boardSlug = uniq('flow-board');
    await page.goto(`${ARENA}${C}/leaderboard/new`);
    await page.getByLabel('Title').fill('Flow board');
    await page.getByLabel('Objective').fill('Flow objective');
    await page.getByLabel('Unit').fill('pts');
    await page.getByLabel('Period').fill('season to date');
    await page.getByLabel('Slug').fill(boardSlug);
    await page.getByRole('button', { name: 'Create board' }).click();
    await page.waitForURL(new RegExp(`/leaderboard/${boardSlug}$`), { timeout: 15_000 });

    await page.goto(`${ARENA}${C}/ledger`);
    const month = '2030-03';
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByRole('textbox', { name: 'Revenue', exact: true }).fill('500');
    await page.getByLabel('Paying customers').fill('5');
    await page.getByRole('button', { name: 'Save month' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/leaderboard/monthly-revenue`);
    await expect(page.getByTestId('leaderboard-row')).toHaveCount(0);

    await page.goto(`${ARENA}${C}/ledger`);
    const row = page.getByTestId('ledger-row').filter({ hasText: month });
    await row.getByTestId('ledger-share-toggle').click();
    await expect(row.getByTestId('ledger-share-toggle')).toHaveAttribute('aria-checked', 'true');

    await page.goto(`${ARENA}${C}/leaderboard/monthly-revenue`);
    await expect(page.getByTestId('leaderboard-row')).toContainText('Mar 2030');
  });
});
