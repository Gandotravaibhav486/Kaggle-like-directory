import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: ledger (shared vs private branches)', () => {
  test('a visitor sees the private notice and the CSV route 404s', async ({ page, browser }) => {
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(`${ARENA}${C}/ledger`);
    await expect(visitorPage.getByTestId('owner-only-notice')).toBeVisible();

    const res = await visitorPage.goto(`${ARENA}${C}/ledger/export.csv`);
    expect(res?.status()).toBe(404);
    await visitor.close();
    void page;
  });

  test('owner adds a month, sees net/margin/collection rate, chart has axis labels, CSV has a header and row', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/ledger`);

    const month = '2031-06';
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByRole('textbox', { name: 'Revenue', exact: true }).fill('1000');
    await page.getByLabel('Paying customers').fill('10');
    await page.getByLabel('Invoices raised').fill('10');
    await page.getByLabel('Invoices paid').fill('8');
    await page.getByLabel('Hosting').fill('100');
    await page.getByRole('button', { name: 'Save month' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/ledger`);
    await expect(page.getByTestId('ledger-summary')).toBeVisible();
    await expect(page.getByTestId('ledger-chart')).toContainText('Amount');
    await expect(page.getByTestId('ledger-chart')).toContainText('Month');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Export CSV' }).click(),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    if (stream) {
      for await (const chunk of stream) chunks.push(chunk as Buffer);
    }
    const csv = Buffer.concat(chunks).toString('utf-8');
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('month,revenue,paying_customers');
    expect(lines.some((l) => l.startsWith(month))).toBe(true);
  });

  test('toggling Shared makes the month appear on Monthly revenue with revenue + customers only, toggling back removes it', async ({
    page,
    browser,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/ledger`);

    const month = '2031-07';
    const sourceMarker = uniq('secret-expense-note');
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByRole('textbox', { name: 'Revenue', exact: true }).fill('2500');
    await page.getByLabel('Paying customers').fill('25');
    await page.getByLabel('AI model usage').fill('77.50');
    await page.getByLabel('Note').fill(sourceMarker);
    await page.getByRole('button', { name: 'Save month' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/ledger`);
    const row = page.getByTestId('ledger-row').filter({ hasText: month });
    const toggle = row.getByTestId('ledger-share-toggle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(`${ARENA}${C}/leaderboard/monthly-revenue`);
    await expect(visitorPage.getByTestId('leaderboard-row')).toContainText('Jul 2031');
    const html = await visitorPage.content();
    expect(html).not.toContain('77.50');
    expect(html).not.toContain(sourceMarker);
    await visitor.close();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    const visitor2 = await browser.newContext();
    const visitorPage2 = await visitor2.newPage();
    await visitorPage2.goto(`${ARENA}${C}/leaderboard/monthly-revenue`);
    await expect(
      visitorPage2.getByTestId('leaderboard-row').filter({ hasText: 'Jul 2031' }),
    ).toHaveCount(0);
    await visitor2.close();
  });
});
