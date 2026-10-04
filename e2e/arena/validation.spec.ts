import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: validation', () => {
  test('a leaderboard entry without date or source note is rejected and nothing is added', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/leaderboard/scoring-stability`);

    const before = await page.getByTestId('leaderboard-row').count();

    await page.getByLabel('Label').fill(uniq('bad-entry'));
    await page.getByLabel('Value').fill('5');
    // Leave date and source note empty.
    await page.getByRole('button', { name: 'Add entry' }).click();

    await expect(page.getByTestId('field-error-entryDate')).toContainText('Date is required');
    await expect(page.getByTestId('field-error-sourceNote')).toContainText('A source note is required');

    const after = await page.getByTestId('leaderboard-row').count();
    expect(after).toBe(before);
  });

  test('a non-numeric value is rejected', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/leaderboard/scoring-stability`);
    await page.getByLabel('Label').fill(uniq('bad-value'));
    await page.getByLabel('Value').fill('not-a-number');
    await page.getByLabel('Date').fill('2026-01-01');
    await page.getByLabel('Source note').fill('a note');
    await page.getByRole('button', { name: 'Add entry' }).click();
    await expect(page.getByTestId('field-error-value')).toContainText('Value must be a number');
  });

  test('ledger: invoices paid cannot exceed invoices raised, negative amounts rejected, duplicate month rejected', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/ledger`);

    const month = '2099-01';
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByRole('textbox', { name: 'Revenue', exact: true }).fill('-5');
    await page.getByLabel('Invoices raised').fill('2');
    await page.getByLabel('Invoices paid').fill('5');
    await page.getByRole('button', { name: 'Save month' }).click();

    await expect(page.getByTestId('field-error-invoicesPaid')).toContainText(
      'Invoices paid cannot exceed invoices raised',
    );
    await expect(page.getByTestId('field-error-revenue')).toContainText('Must be zero or more');

    // Fix it and save a valid month, then try to duplicate it. Re-fill every field: a
    // server action round trip can remount the (uncontrolled) form and drop prior values.
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByRole('textbox', { name: 'Revenue', exact: true }).fill('100');
    await page.getByLabel('Invoices raised').fill('2');
    await page.getByLabel('Invoices paid').fill('2');
    await page.getByRole('button', { name: 'Save month' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/ledger`);
    await page.getByRole('textbox', { name: /month/i }).fill(month);
    await page.getByLabel('Invoices raised').fill('1');
    await page.getByLabel('Invoices paid').fill('1');
    await page.getByRole('button', { name: 'Save month' }).click();
    await expect(page.getByTestId('form-error')).toContainText('That month already exists');
  });

  test('season creation rejects an invalid slug and a duplicate slug', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}/seasons/new`);
    await page.getByLabel('Slug').fill('Not A Valid Slug!');
    await page.getByLabel('Title').fill('Invalid slug season');
    await page.getByRole('button', { name: 'Create season' }).click();
    await expect(page.getByTestId('field-error-slug')).toContainText('Use lowercase letters, numbers and hyphens');

    await page.getByLabel('Slug').fill(DEFAULT_SLUG);
    await page.getByLabel('Title').fill('Duplicate slug season');
    await page.getByRole('button', { name: 'Create season' }).click();
    await expect(page.getByTestId('form-error')).toContainText('Slug already in use');
  });
});
