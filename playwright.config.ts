import { defineConfig, devices } from '@playwright/test';
import { APP_ENV, ARENA, DB_SERVER_ENV, E2E_PG_READY_URL, LAB, LAB_MOCK, VIEWPORTS } from './e2e/helpers/env';

// Browser tests run against PRODUCTION builds (`pnpm test:e2e` builds first) and a fresh
// embedded Postgres in .data/pg-e2e. All env is explicit (ARCHITECTURE §8.3); .env is ignored.
// The persistence spec spawns its own arena on port 3103 (e2e/helpers/spawn.ts).

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1, // one shared database
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/helpers/global-setup.ts',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /screens\.spec\.ts/,
      grepInvert: /@screens|@mobile/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height },
      },
    },
    {
      // Specs tagged @mobile run at 390x844 (e.g. "table scrolls inside its container").
      name: 'chromium-mobile',
      testIgnore: /screens\.spec\.ts/,
      grep: /@mobile/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: VIEWPORTS.mobile.width, height: VIEWPORTS.mobile.height },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    {
      // Visual QA: full-page screenshots at 1440x900 and 390x844, light and dark,
      // into docs/qa/screenshots/<viewport>/<theme>/<route>.png. Run: pnpm test:screens
      name: 'screens',
      testMatch: /screens\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'db',
      command: 'pnpm --filter @mi/db server --fresh',
      url: E2E_PG_READY_URL,
      env: DB_SERVER_ENV,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    },
    {
      name: 'arena',
      command: 'pnpm --filter @mi/arena exec next start -p 3100',
      url: `${ARENA}/api/health`,
      env: { ...APP_ENV, PORT: '3100' },
      timeout: 120_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
    {
      name: 'lab',
      command: 'pnpm --filter @mi/lab exec next start -p 3101',
      url: `${LAB}/api/health`,
      env: { ...APP_ENV, PORT: '3101' },
      timeout: 120_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
    {
      name: 'lab-mock-claude',
      command: 'pnpm --filter @mi/lab exec next start -p 3102',
      url: `${LAB_MOCK}/api/health`,
      env: { ...APP_ENV, PORT: '3102', MOCK_CLAUDE: '1' },
      timeout: 120_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
  ],
});
