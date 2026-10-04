// Helpers for the embedded Postgres 18 server used in local development and e2e.
// Only scripts import this file; app code never does.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import postgres from 'postgres';
import { DEFAULT_LOCAL_PG_PORT } from '../src/client';
import { repoRoot } from '../src/env';

export function localPgConfig(): { dir: string; port: number; url: string } {
  const dir = path.resolve(repoRoot, process.env.LOCAL_PG_DIR?.trim() || '.data/pg');
  const port = Number(process.env.LOCAL_PG_PORT?.trim() || DEFAULT_LOCAL_PG_PORT);
  return { dir, port, url: `postgres://postgres:postgres@127.0.0.1:${port}/postgres` };
}

/**
 * pnpm skips dependency postinstall scripts that are not approved (allowBuilds). The platform
 * package needs its native/lib symlinks, so recreate them here when they are missing.
 */
export function ensureNativeSymlinks(): void {
  const platformPkg = `@embedded-postgres/${process.platform}-${process.arch}`;
  let pkgRoot: string;
  try {
    const req = createRequire(createRequire(import.meta.url).resolve('embedded-postgres'));
    const entry = req.resolve(platformPkg);
    pkgRoot = path.resolve(path.dirname(entry), '..');
    while (!existsSync(path.join(pkgRoot, 'package.json')) && pkgRoot !== path.dirname(pkgRoot)) {
      pkgRoot = path.dirname(pkgRoot);
    }
  } catch {
    throw new Error(`embedded-postgres has no binary package for ${process.platform}-${process.arch} (${platformPkg}).`);
  }
  const listFile = path.join(pkgRoot, 'native', 'pg-symlinks.json');
  if (!existsSync(listFile)) return;
  const links = JSON.parse(readFileSync(listFile, 'utf8')) as Array<{ source: string; target: string }>;
  const missing = links.some((l) => {
    try {
      lstatSync(path.join(pkgRoot, l.target));
      return false;
    } catch {
      return true;
    }
  });
  if (!missing) return;
  console.log(`[local-pg] restoring native symlinks in ${platformPkg}`);
  const res = spawnSync(process.execPath, [path.join(pkgRoot, 'scripts', 'hydrate-symlinks.js')], {
    cwd: pkgRoot,
    stdio: 'inherit',
  });
  if (res.status !== 0) throw new Error('Could not restore embedded-postgres native symlinks');
}

/** true if a Postgres server answers `select 1` at url. */
export async function canConnect(url: string): Promise<boolean> {
  const sql = postgres(url, { max: 1, connect_timeout: 3, prepare: false, onnotice: () => {} });
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}

export interface StartedPg {
  pg: EmbeddedPostgres;
  stop: () => Promise<void>;
}

/** Initialises (if needed) and starts the embedded server on dir/port. */
export async function startEmbedded(opts: { dir: string; port: number; fresh?: boolean; quiet?: boolean }): Promise<StartedPg> {
  ensureNativeSymlinks();
  if (opts.fresh && existsSync(opts.dir)) rmSync(opts.dir, { recursive: true, force: true });
  const hasCluster = existsSync(path.join(opts.dir, 'PG_VERSION'));
  if (!hasCluster && existsSync(opts.dir)) {
    // A half-initialised directory makes initdb fail; start clean.
    rmSync(opts.dir, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(opts.dir), { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: opts.dir,
    user: 'postgres',
    password: 'postgres',
    port: opts.port,
    persistent: true,
    onLog: () => {},
    onError: (e) => {
      if (!opts.quiet) console.error('[local-pg]', typeof e === 'string' ? e.trim() : e);
    },
  });
  if (!hasCluster) {
    console.log(`[local-pg] initialising a new cluster in ${path.relative(repoRoot, opts.dir) || opts.dir}`);
    await pg.initialise();
  }
  await pg.start();
  let stopped = false;
  return {
    pg,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      await pg.stop();
    },
  };
}

/**
 * Stops a server left running from a killed process if (and only if) its postmaster.pid lives in
 * dir. Returns true when the port is free afterwards.
 */
export async function stopOrphan(dir: string, url: string): Promise<boolean> {
  const pidFile = path.join(dir, 'postmaster.pid');
  if (!existsSync(pidFile)) return false;
  const pid = Number(readFileSync(pidFile, 'utf8').split('\n')[0]);
  if (!Number.isInteger(pid) || pid <= 0) return false;
  console.log(`[local-pg] stopping leftover Postgres (pid ${pid}) that owns ${dir}`);
  try {
    process.kill(pid, 'SIGINT'); // fast shutdown
  } catch {
    return false;
  }
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (!(await canConnect(url))) return true;
  }
  return false;
}
