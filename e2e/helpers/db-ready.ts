import { E2E_PG_READY_URL } from './env';

/** Polls the local-pg readiness endpoint until it answers 200 (migrated and seeded). */
export async function waitForDbReady(timeoutMs = 120_000, url = E2E_PG_READY_URL): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Database not ready at ${url} after ${timeoutMs} ms (${last})`);
}

/** Polls an app's /api/health until it returns 200. */
export async function waitForHealthy(baseURL: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return;
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = (err as Error).message;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${baseURL} not healthy after ${timeoutMs} ms (${last})`);
}
