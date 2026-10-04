import { expect, test } from '@playwright/test';
import { DEFAULT_SLUG, LAB, LAB_MOCK } from '../helpers/env';

const C = `/competitions/${DEFAULT_SLUG}`;

async function firstThreadHref(page: import('@playwright/test').Page, base: string): Promise<string> {
  await page.goto(`${base}${C}/discussion`);
  const href = await page.getByTestId('thread-list-item').first().locator('a').first().getAttribute('href');
  if (!href) throw new Error('No thread found');
  return href.startsWith('http') ? new URL(href).pathname : href;
}

test.describe('Claude observations: both branches', () => {
  test('not configured on the plain lab server', async ({ page }) => {
    const href = await firstThreadHref(page, LAB);
    await page.goto(`${LAB}${href}`);
    await expect(page.getByTestId('claude-not-configured')).toBeVisible();
    await expect(page.getByTestId('claude-button')).toBeDisabled();
  });

  test('mock success posts a Generated + Mock reply on the mock lab server', async ({ page }) => {
    const href = await firstThreadHref(page, LAB_MOCK);
    await page.goto(`${LAB_MOCK}${href}`);
    await expect(page.getByTestId('claude-not-configured')).toHaveCount(0);

    const button = page.getByTestId('claude-button');
    await expect(button).toBeEnabled();
    await button.click();

    const reply = page.getByTestId('agent-reply').filter({ hasText: 'Claude' }).last();
    await expect(reply).toBeVisible({ timeout: 20_000 });
    await expect(reply).toHaveAttribute('data-mock', 'true');
    await expect(reply.getByText('Observations')).toBeVisible();
    await expect(reply.getByText('Suggestions')).toBeVisible();
    await expect(reply.getByText('Biggest risk')).toBeVisible();
    await expect(reply.getByText('Missing information')).toBeVisible();
  });
});
