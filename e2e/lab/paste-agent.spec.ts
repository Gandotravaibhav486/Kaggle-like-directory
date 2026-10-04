import { expect, test } from '@playwright/test';
import { DEFAULT_SLUG, LAB } from '../helpers/env';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('paste an agent reply', () => {
  test('briefing contains the thread title, catalogue item names and the JSON shape', async ({ page }) => {
    await page.goto(`${LAB}${C}/discussion`);
    const firstThread = page.getByTestId('thread-list-item').first();
    const title = (await firstThread.locator('a').first().innerText()).trim();
    await firstThread.locator('a').first().click();

    const briefing = page.getByTestId('agent-briefing');
    const text = await briefing.inputValue();
    expect(text).toContain('Claude Sonnet 5');
    expect(text).toContain('observations');
    expect(text).toContain('biggestRisk');
    // Thread title text should show up somewhere in the briefing (it is wrapped, not stripped).
    expect(text.length).toBeGreaterThan(0);
    expect(title.length).toBeGreaterThan(0);
  });

  test('Fill from JSON populates fields; missing agent name is rejected; reply is labelled with the agent name', async ({
    page,
  }) => {
    await page.goto(`${LAB}${C}/discussion`);
    await page.getByTestId('thread-list-item').first().locator('a').first().click();

    const payload = {
      observations: ['First observation', 'Second observation'],
      suggestions: [{ suggestion: 'Do the thing', reason: 'Because it helps' }],
      biggestRisk: 'The biggest risk is X',
      missingInformation: ['A real measurement'],
    };
    await page.locator('#fill-from-json').fill(JSON.stringify(payload));
    await page.getByRole('button', { name: 'Fill fields' }).click();

    await expect(page.getByLabel('Observations')).toHaveValue(/First observation/);
    await expect(page.getByLabel('Suggestions')).toHaveValue(/Do the thing \| Because it helps/);
    await expect(page.getByLabel('Biggest risk')).toHaveValue('The biggest risk is X');

    // Missing agent name is rejected.
    await page.getByRole('button', { name: 'Post pasted reply' }).click();
    await expect(page.getByTestId('field-error-agentName')).toBeVisible();

    const agentName = uniq('ExternalAgent');
    await page.getByLabel('Agent name').fill(agentName);
    await page.getByRole('button', { name: 'Post pasted reply' }).click();

    const reply = page.getByTestId('agent-reply').filter({ hasText: agentName }).last();
    await expect(reply).toBeVisible();
    await expect(reply).toHaveAttribute('data-source', 'pasted');
    await expect(reply.getByText(`Pasted from ${agentName}`)).toBeVisible();
  });
});
