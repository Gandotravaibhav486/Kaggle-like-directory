import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** packages/db */
export const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** repository root */
export const repoRoot = path.resolve(packageDir, '../..');

/** Loads the root .env (does not override variables that are already set). Scripts only. */
export function loadRootEnv(): void {
  const file = path.join(repoRoot, '.env');
  if (!existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch (err) {
    console.warn(`[env] could not load ${file}:`, (err as Error).message);
  }
}
