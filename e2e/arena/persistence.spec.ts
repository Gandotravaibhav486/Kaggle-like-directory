import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { startArena } from '../helpers/spawn';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: persistence across reload and server restart', () => {
  test('an entry survives a reload, a new browser context, and a freshly spawned server process', async ({
    page,
    browser,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/leaderboard/scoring-stability`);

    const label = uniq('persisted-entry');
    await page.getByLabel('Label').fill(label);
    await page.getByLabel('Value').fill('42');
    await page.getByLabel('Date').fill('2026-02-01');
    await page.getByLabel('Source note').fill('persistence check');
    await page.getByRole('button', { name: 'Add entry' }).click();
    await expect(page.getByText('Added')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByTestId('leaderboard-table')).toContainText(label);

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(`${ARENA}${C}/leaderboard/scoring-stability`);
    await expect(page2.getByTestId('leaderboard-table')).toContainText(label);
    await context2.close();

    const spawned = await startArena();
    try {
      const page3 = await (await browser.newContext()).newPage();
      await page3.goto(`${spawned.url}${C}/leaderboard/scoring-stability`);
      await expect(page3.getByTestId('leaderboard-table')).toContainText(label);
    } finally {
      await spawned.stop();
    }
  });
});
