import { expect, test } from '@playwright/test';
import { DEFAULT_SLUG, LAB } from '../helpers/env';

const C = `/competitions/${DEFAULT_SLUG}`;

test('data catalogue lists the seeded resources with kinds', async ({ page }) => {
  await page.goto(`${LAB}${C}/data`);
  await expect(page.getByTestId('data-row')).toHaveCount(10);
  await expect(page.getByText('Claude Sonnet 5')).toBeVisible();
  await expect(page.getByText('model').first()).toBeVisible();
});

test('the data table scrolls inside its own container at 390px width @mobile', async ({ page }) => {
  await page.goto(`${LAB}${C}/data`);
  const region = page.getByTestId('scroll-table-region');
  await expect(region).toBeVisible();
  const [scrollWidth, clientWidth] = await region.evaluate((el) => [el.scrollWidth, el.clientWidth]);
  expect(scrollWidth).toBeGreaterThan(clientWidth);
});
