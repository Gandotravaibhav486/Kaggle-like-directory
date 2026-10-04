import { expect, test, type Page } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

async function createBoard(page: Page, opts: { title: string; slug: string; direction: 'higher' | 'lower' }) {
  await page.goto(`${ARENA}${C}/leaderboard/new`);
  await page.getByLabel('Title').fill(opts.title);
  await page.getByLabel('Objective').fill('Test objective');
  await page.getByLabel('Unit').fill('pts');
  await page.getByLabel('Direction').selectOption(opts.direction);
  await page.getByLabel('Period').fill('season to date');
  await page.getByLabel('Slug').fill(opts.slug);
  await page.getByRole('button', { name: 'Create board' }).click();
  await page.waitForURL(new RegExp(`/leaderboard/${opts.slug}$`));
}

async function addEntry(
  page: Page,
  opts: { label: string; value: string; date: string; sourceNote: string },
) {
  await page.getByLabel('Label').fill(opts.label);
  await page.getByLabel('Value').fill(opts.value);
  await page.getByLabel('Date').fill(opts.date);
  await page.getByLabel('Source note').fill(opts.sourceNote);
  await page.getByRole('button', { name: 'Add entry' }).click();
  // Wait for the row to actually land in the table (stronger signal than the transient
  // "Added" message, which can be replaced by a server-action refresh before we check it).
  await expect(page.getByTestId('leaderboard-row').filter({ hasText: opts.label })).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('arena: leaderboard ranking (both direction branches)', () => {
  test('higher-is-better ranks descending and lower-is-better ranks ascending, with shared ranks on ties', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);

    const higherSlug = uniq('higher-board');
    const lowerSlug = uniq('lower-board');

    await createBoard(page, { title: 'Higher board', slug: higherSlug, direction: 'higher' });
    await addEntry(page, { label: 'Alpha', value: '10', date: '2026-01-01', sourceNote: 'note a' });
    await addEntry(page, { label: 'Bravo', value: '20', date: '2026-01-02', sourceNote: 'note b' });
    await addEntry(page, { label: 'Charlie', value: '20', date: '2026-01-03', sourceNote: 'note c' });

    await page.goto(`${ARENA}${C}/leaderboard/${higherSlug}`);
    const higherRows = page.getByTestId('leaderboard-row');
    await expect(higherRows).toHaveCount(3);
    // Bravo and Charlie tie at 20 (highest), both rank 1=; Alpha (10) ranks 3.
    await expect(higherRows.nth(0)).toContainText('Bravo');
    await expect(higherRows.nth(0)).toHaveAttribute('data-rank', '1');
    await expect(higherRows.nth(1)).toContainText('Charlie');
    await expect(higherRows.nth(1)).toHaveAttribute('data-rank', '1');
    await expect(higherRows.nth(1)).toContainText('1=');
    await expect(higherRows.nth(2)).toContainText('Alpha');
    await expect(higherRows.nth(2)).toHaveAttribute('data-rank', '3');

    await createBoard(page, { title: 'Lower board', slug: lowerSlug, direction: 'lower' });
    await addEntry(page, { label: 'Alpha', value: '10', date: '2026-01-01', sourceNote: 'note a' });
    await addEntry(page, { label: 'Bravo', value: '20', date: '2026-01-02', sourceNote: 'note b' });
    await addEntry(page, { label: 'Charlie', value: '20', date: '2026-01-03', sourceNote: 'note c' });

    await page.goto(`${ARENA}${C}/leaderboard/${lowerSlug}`);
    const lowerRows = page.getByTestId('leaderboard-row');
    await expect(lowerRows).toHaveCount(3);
    // Lower is better: Alpha (10) is rank 1; Bravo/Charlie tie for rank 2=.
    await expect(lowerRows.nth(0)).toContainText('Alpha');
    await expect(lowerRows.nth(0)).toHaveAttribute('data-rank', '1');
    await expect(lowerRows.nth(1)).toContainText('Bravo');
    await expect(lowerRows.nth(1)).toHaveAttribute('data-rank', '2');
    await expect(lowerRows.nth(1)).toContainText('2=');
    await expect(lowerRows.nth(2)).toContainText('Charlie');
    await expect(lowerRows.nth(2)).toHaveAttribute('data-rank', '2');

    // Progress bar renders against (no) target.
    await expect(page.getByTestId('progress-bar')).toHaveCount(0);
  });

  test('seeded example rows show an Example badge, and Remove all examples clears them', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/leaderboard/scoring-stability`);
    await expect(page.getByTestId('example-badge').first()).toBeVisible();

    await page.goto(`${ARENA}${C}/leaderboard`);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Remove all examples' }).click();
    await expect(page.getByText(/Removed \d+/)).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/leaderboard/scoring-stability`);
    await expect(page.getByTestId('example-badge')).toHaveCount(0);
  });
});
