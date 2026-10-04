import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { E2E_DATABASE_URL } from './env';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Wipes, migrates and re-seeds the e2e database (the servers keep running; they reconnect).
 * Specs should prefer unique data (uniq()) over resetting; use this only when a spec truly
 * needs the pristine seed, and never in parallel with other specs.
 */
export function resetE2eDatabase(): void {
  execFileSync('pnpm', ['--filter', '@mi/db', 'reset'], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
  });
}
