import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: sales pipeline', () => {
  test('a visitor sees the private notice and no Pipeline tab', async ({ browser }) => {
    const visitor = await browser.newContext();
    const page = await visitor.newPage();
    await page.goto(`${ARENA}${C}/pipeline`);
    await expect(page.getByTestId('owner-only-notice')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pipeline', exact: true })).toHaveCount(0);
    await visitor.close();
  });

  test('owner adds a prospect, form validation rejects out-of-order dates, then advances it through the funnel', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/pipeline`);
    const company = uniq('Acme Campus');

    // Validation: reply before the outreach email.
    await page.getByLabel('Company').last().fill(company);
    await page.getByLabel('Outreach emailed').last().fill('2026-09-10');
    await page.getByLabel('Replied').last().fill('2026-09-01');
    await page.getByRole('button', { name: 'Save prospect' }).last().click();
    await expect(page.getByTestId('field-error-repliedOn')).toContainText('on or after');

    await page.getByLabel('Replied').last().fill('');
    await page.getByRole('button', { name: 'Save prospect' }).last().click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.reload();
    const row = page.getByTestId('prospect-row').filter({ hasText: company });
    await expect(row.getByTestId('prospect-stage')).toHaveText('Emailed');

    await row.getByTestId('prospect-advance').click();
    await expect(row.getByTestId('prospect-stage')).toHaveText('Replied', { timeout: 10_000 });
    await row.getByTestId('prospect-advance').click();
    await expect(row.getByTestId('prospect-stage')).toHaveText('Demo', { timeout: 10_000 });

    const funnel = page.getByTestId('pipeline-funnel');
    await expect(funnel).toBeVisible();
    await expect(page.getByTestId('pipeline-summary')).toContainText('Reply rate');

    // Persists across reload.
    await page.reload();
    await expect(page.getByTestId('prospect-row').filter({ hasText: company }).getByTestId('prospect-stage')).toHaveText(
      'Demo',
    );
  });
});
