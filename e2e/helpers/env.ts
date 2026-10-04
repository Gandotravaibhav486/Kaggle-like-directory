// Shared constants for every Playwright spec. Never read from .env (ARCHITECTURE §1.4, §8.3).
export const ARENA = 'http://localhost:3100';
export const LAB = 'http://localhost:3101';
/** Lab with MOCK_CLAUDE=1 (Claude observations "available" branch). */
export const LAB_MOCK = 'http://localhost:3102';
/** Port used by the persistence spec for a freshly spawned arena process. */
export const ARENA_RESTART_PORT = 3103;
export const ARENA_RESTART = `http://localhost:${ARENA_RESTART_PORT}`;

export const OWNER_EMAIL = 'owner@example.test';
export const DEFAULT_SLUG = 'mock-interview-v5';

export const E2E_PG_PORT = 54339;
export const E2E_PG_READY_URL = `http://127.0.0.1:${E2E_PG_PORT + 1}/ready`;
export const E2E_DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${E2E_PG_PORT}/postgres`;

export const VIEWPORTS = {
  desktop: { name: '1440x900', width: 1440, height: 900 },
  mobile: { name: '390x844', width: 390, height: 844 },
} as const;
export type ViewportKey = keyof typeof VIEWPORTS;

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
/** localStorage key read by ThemeScript (DESIGN.md §3, ARCHITECTURE §6.10). */
export const THEME_STORAGE_KEY = 'mi-theme';

/** Env for every app server (ARCHITECTURE §8.3). Values are explicit so a developer's shell or .env cannot leak in. */
export const APP_ENV: Record<string, string> = {
  DATABASE_URL: E2E_DATABASE_URL,
  OWNER_EMAIL,
  AUTH_SECRET: 'e2e-only-secret-not-for-production-0123456789',
  AUTH_TRUST_HOST: 'true',
  DEV_MAGIC_LINK: '1',
  ARENA_URL: ARENA,
  LAB_URL: LAB,
  DEFAULT_COMPETITION_SLUG: DEFAULT_SLUG,
  ANTHROPIC_API_KEY: '',
  MOCK_CLAUDE: '',
  SMTP_HOST: '',
  SMTP_PORT: '',
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_FROM: '',
};

/** Env for the e2e database server (fresh cluster in .data/pg-e2e). */
export const DB_SERVER_ENV: Record<string, string> = {
  DATABASE_URL: '',
  LOCAL_PG_DIR: '.data/pg-e2e',
  LOCAL_PG_PORT: String(E2E_PG_PORT),
};
