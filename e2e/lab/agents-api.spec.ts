import { expect, test } from '@playwright/test';
import { ARENA, DEFAULT_SLUG, LAB } from '../helpers/env';
import { signInAsOwner } from '../helpers/auth';
import { uniq } from '../helpers/unique';

const C = `/competitions/${DEFAULT_SLUG}`;

test.describe('agent token API', () => {
  test('owner creates a token, posts via the API, rate limits, revokes, and can hide the reply', async ({
    page,
    request,
  }) => {
    await signInAsOwner(page, LAB);

    await page.goto(`${LAB}${C}/discussion`);
    await page.getByTestId('thread-list-item').first().locator('a').first().click();
    // Next.js client-side navigation updates the URL via history.pushState, which can race
    // page.url() right after click(); wait for it explicitly before reading the thread id.
    await page.waitForURL(/\/discussion\/[a-f0-9-]+$/);
    const threadUrl = page.url();
    const threadId = threadUrl.split('/discussion/')[1]!;

    await page.goto(`${LAB}${C}/agents`);
    const tokenName = uniq('ci-token');
    await page.getByLabel('Name').fill(tokenName);
    await page.getByLabel('Rate limit (per window)').fill('3');
    await page.getByLabel('Window (seconds)').fill('60');
    await page.getByRole('button', { name: 'Create token' }).click();

    const plaintext = await page.getByTestId('token-plaintext').innerText();
    expect(plaintext).toMatch(/^mi_agt_/);

    // No token -> 401.
    const noAuth = await request.post(`${LAB}/api/agents/replies`, {
      data: { threadId, payload: { observations: ['x'], suggestions: [], biggestRisk: 'r', missingInformation: [] } },
    });
    expect(noAuth.status()).toBe(401);

    // Bad payload -> 400.
    const badPayload = await request.post(`${LAB}/api/agents/replies`, {
      headers: { authorization: `Bearer ${plaintext}` },
      data: { threadId, payload: {} },
    });
    expect(badPayload.status()).toBe(400);

    // Two good calls within the limit of 3.
    let lastReplyId = '';
    for (let i = 0; i < 2; i++) {
      const res = await request.post(`${LAB}/api/agents/replies`, {
        headers: { authorization: `Bearer ${plaintext}` },
        data: {
          threadId,
          agentName: 'CI agent',
          payload: { observations: ['Observed via API'], suggestions: [], biggestRisk: 'Risk via API', missingInformation: [] },
        },
      });
      expect(res.status()).toBe(201);
      lastReplyId = (await res.json()).id;
    }

    // Reply appears in the thread, labelled "Posted via API".
    await page.goto(threadUrl);
    const apiReply = page.getByTestId('agent-reply').filter({ hasText: 'CI agent' }).last();
    await expect(apiReply).toBeVisible();
    await expect(apiReply).toHaveAttribute('data-source', 'api');
    await expect(apiReply.getByText('Posted via API')).toBeVisible();

    // The rate limit (3 per window) is consumed by the rate-limit check running before body
    // validation (ARCHITECTURE §6.3): the bad-payload call above already used 1 of 3, and the
    // loop above used the other 2, so the very next call is already over the limit -> 429.
    const fourth = await request.post(`${LAB}/api/agents/replies`, {
      headers: { authorization: `Bearer ${plaintext}` },
      data: { threadId, payload: { observations: ['x'], suggestions: [], biggestRisk: 'r', missingInformation: [] } },
    });
    expect(fourth.status()).toBe(429);
    expect(fourth.headers()['retry-after']).toBeTruthy();

    // Revoke the token on the agents page.
    await page.goto(`${LAB}${C}/agents`);
    const tokenRow = page.getByTestId('token-row').filter({ hasText: tokenName });
    page.once('dialog', (d) => d.accept());
    await tokenRow.getByRole('button', { name: 'Revoke' }).click();
    // The revoke action is fire-and-forget on the client; wait for the row to actually show
    // Revoked (confirming the server action committed) before relying on it being revoked.
    await expect(tokenRow.getByText('Revoked')).toBeVisible();

    const afterRevoke = await request.post(`${LAB}/api/agents/replies`, {
      headers: { authorization: `Bearer ${plaintext}` },
      data: { threadId, payload: { observations: ['x'], suggestions: [], biggestRisk: 'r', missingInformation: [] } },
    });
    expect(afterRevoke.status()).toBe(401);

    // Owner hides the API reply; a visitor sees the placeholder instead.
    await page.goto(threadUrl);
    const hideButton = page.getByTestId('agent-reply').filter({ hasText: 'CI agent' }).first().getByRole('button', { name: 'Hide' });
    page.once('dialog', (d) => d.accept());
    await hideButton.click();

    const visitorContext = await page.context().browser()!.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto(threadUrl);
    await expect(visitorPage.getByText('This reply has been hidden by the owner.').first()).toBeVisible();
    await visitorContext.close();

    void lastReplyId;
  });

  test('a token scoped to a different competition gets 403 wrong_competition', async ({ page, request, browser }) => {
    await signInAsOwner(page, ARENA);
    const newSlug = uniq('agents-api-season');
    await page.goto(`${ARENA}/seasons/new`);
    await page.getByLabel('Slug').fill(newSlug);
    await page.getByLabel('Title').fill(uniq('Agents API season'));
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(new RegExp(`/competitions/${newSlug}/`));

    const labContext = await browser.newContext();
    const labPage = await labContext.newPage();
    await signInAsOwner(labPage, LAB);
    await labPage.goto(`${LAB}/competitions/${newSlug}/agents`);
    await labPage.getByLabel('Name').fill(uniq('other-season-token'));
    await labPage.getByRole('button', { name: 'Create token' }).click();
    const otherPlaintext = await labPage.getByTestId('token-plaintext').innerText();

    await labPage.goto(`${LAB}${C}/discussion`);
    const defaultThreadId = (await labPage.getByTestId('thread-list-item').first().locator('a').first().getAttribute('href'))!
      .split('/discussion/')[1]!;

    const res = await request.post(`${LAB}/api/agents/replies`, {
      headers: { authorization: `Bearer ${otherPlaintext}` },
      data: { threadId: defaultThreadId, payload: { observations: ['x'], suggestions: [], biggestRisk: 'r', missingInformation: [] } },
    });
    expect(res.status()).toBe(403);
    await labContext.close();
  });
});
