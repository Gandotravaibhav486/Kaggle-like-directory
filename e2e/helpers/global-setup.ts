import type { FullConfig } from '@playwright/test';
import { waitForDbReady, waitForHealthy } from './db-ready';
import { ARENA, LAB, LAB_MOCK } from './env';

/**
 * Runs after the webServers are up. The database server was started with --fresh, which wipes
 * .data/pg-e2e, initialises a new cluster, migrates and seeds; here we only confirm everything
 * is ready so the first spec does not race the servers.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  await waitForDbReady();
  await Promise.all([ARENA, LAB, LAB_MOCK].map((u) => waitForHealthy(u)));
}
