import { expect, test } from '@playwright/test';
import { signInAsOwner } from '../helpers/auth';
import { ARENA, DEFAULT_SLUG } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('arena: undo/redo and revision history', () => {
  test('fill A, fill B, Undo restores A, Redo reapplies B, keyboard shortcuts work', async ({ page }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/edit/evaluation`);

    const a = uniq('revision-a');
    const b = uniq('revision-b');
    const textarea = page.getByTestId('markdown-editor-input');

    await textarea.fill(a);
    await textarea.fill(b);
    await expect(textarea).toHaveValue(b);

    await page.getByTestId('editor-undo').click();
    await expect(textarea).toHaveValue(a);

    await page.getByTestId('editor-redo').click();
    await expect(textarea).toHaveValue(b);

    // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo.
    await textarea.click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);
    await expect(textarea).toHaveValue(a);
    await page.keyboard.press(`${modifier}+Shift+z`);
    await expect(textarea).toHaveValue(b);
  });

  test('save twice, open history, restore revision 1, page shows old body and history shows Restored from #1', async ({
    page,
  }) => {
    await signInAsOwner(page, ARENA);
    await page.goto(`${ARENA}${C}/edit/rules`);

    const first = uniq('rules-first');
    const second = uniq('rules-second');
    const textarea = page.getByTestId('markdown-editor-input');

    await textarea.fill(first);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await page.getByTestId('markdown-editor-input').fill(second);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/history/rules`);
    await expect(page.getByTestId('revision-list')).toBeVisible();

    // Find the row containing `first` by navigating each revision until found, then restore it.
    const revisionLinks = await page.getByTestId('revision-list').getByRole('link').all();
    let targetRevision: string | null = null;
    for (const link of revisionLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      await page.goto(`${ARENA}${href}`);
      const bodyText = await page.locator('main').innerText();
      if (bodyText.includes(first)) {
        const match = href.match(/rev=(\d+)/);
        targetRevision = match?.[1] ?? null;
        break;
      }
    }
    expect(targetRevision, 'revision containing the first body').toBeTruthy();

    page.once('dialog', (d) => d.accept());
    await page
      .locator('li', { hasText: `#${targetRevision}` })
      .getByRole('button', { name: 'Restore this revision' })
      .click();

    await expect(page.getByText(`Restored from #${targetRevision}`)).toBeVisible({ timeout: 10_000 });

    await page.goto(`${ARENA}${C}/rules`);
    await expect(page.getByTestId('markdown-view')).toContainText(first);
  });
});
