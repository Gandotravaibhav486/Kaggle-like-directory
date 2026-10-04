import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: markdown editor', () => {
  test('owner edits Description, live preview updates, saves, and a visitor sees the change after reload', async ({
    page,
    browser,
  }) => {
    await signInAsOwner(page, ARENA);

    await page.goto(`${ARENA}${C}/edit/description`);
    const marker = uniq('edited-description');
    const textarea = page.getByTestId('markdown-editor-input');
    await expect(textarea).toBeVisible();
    await textarea.fill(`# ${marker}\n\nSome body text.`);

    // Live preview updates while typing (desktop split view keeps the preview panel in the DOM).
    await expect(page.getByTestId('markdown-preview')).toContainText(marker);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByTestId('markdown-editor-input')).toHaveValue(new RegExp(marker));

    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(`${ARENA}${C}/description`);
    await expect(visitorPage.getByTestId('markdown-view')).toContainText(marker);
    await visitor.close();
  });

  test('a script tag typed into markdown is not rendered as HTML', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/edit/description`);

    const marker = uniq('xss');
    const payload = `${marker} <script>window.__xss=true</script> <img src=x onerror="window.__xss=true">`;
    const textarea = page.getByTestId('markdown-editor-input');
    await textarea.fill(payload);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/description`);
    const hasXss = await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss);
    expect(hasXss).toBeFalsy();
    // skipHtml means the raw tags render as visible, escaped text, not markup.
    await expect(page.getByTestId('markdown-view')).toContainText(marker);
    expect(await page.locator('script', { hasText: '__xss' }).count()).toBe(0);
  });
});
