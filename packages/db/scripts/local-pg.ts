// Local Postgres server for development and e2e (ARCHITECTURE §2.3).
// Usage: tsx scripts/local-pg.ts [--fresh]
import { createServer, type Server } from 'node:http';
import { createDb, createPostgresClient } from '../src/client';
import { loadRootEnv } from '../src/env';
import { runMigrations } from '../src/migrate';
import { seed } from '../src/seed';
import { canConnect, localPgConfig, startEmbedded, stopOrphan, type StartedPg } from './embedded';

loadRootEnv();
const fresh = process.argv.includes('--fresh');
const remote = process.env.DATABASE_URL?.trim();
const { dir, port, url: localUrl } = localPgConfig();
const readyPort = port + 1;

let ready = false;
let server: Server | undefined;
let started: StartedPg | undefined;

function serveReady(): Promise<void> {
  return new Promise((resolve) => {
    server = createServer((req, res) => {
      if (req.method === 'GET' && (req.url === '/ready' || req.url?.startsWith('/ready?'))) {
        res.writeHead(ready ? 200 : 503, { 'content-type': 'text/plain' });
        res.end(ready ? 'ok' : 'starting');
        return;
      }
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[local-pg] readiness port ${readyPort} is already in use; another local-pg process is serving /ready`);
        server = undefined;
        resolve();
      } else {
        console.error('[local-pg] readiness server error', err);
        process.exit(1);
      }
    });
    server.listen(readyPort, '127.0.0.1', () => resolve());
  });
}

let shuttingDown = false;
async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  if (started) {
    try {
      await started.stop();
      console.log('[local-pg] stopped');
    } catch (err) {
      console.error('[local-pg] stop failed', err);
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

async function migrateAndSeed(url: string, doSeed: boolean) {
  const client = createPostgresClient(url, { max: 2 });
  try {
    const db = createDb(client);
    await runMigrations(db, 'postgres-js');
    if (doSeed) {
      const report = await seed(db);
      console.log('[local-pg] seed', report);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

try {
  if (remote) {
    console.log('DATABASE_URL set; local Postgres not started');
    await serveReady();
    await migrateAndSeed(remote, false);
  } else {
    if (await canConnect(localUrl)) {
      if (fresh) {
        // A leftover server from a killed run (e.g. a previous e2e run). Stop it if it owns our dir.
        if (!(await stopOrphan(dir, localUrl))) {
          console.error(`[local-pg] --fresh requested but another server is running on port ${port}. Stop it first.`);
          process.exit(1);
        }
        started = await startEmbedded({ dir, port, fresh });
        console.log(`[local-pg] Postgres 18 listening on 127.0.0.1:${port} (data: ${dir})`);
      } else {
      // Deviation from §2.3 (exit 0): staying alive keeps `concurrently -k` in `pnpm dev` from
      // killing the apps when a server from another terminal is already up.
      console.log(`[local-pg] already running on port ${port}; reusing it`);
      }
    } else {
      started = await startEmbedded({ dir, port, fresh });
      console.log(`[local-pg] Postgres 18 listening on 127.0.0.1:${port} (data: ${dir})`);
    }
    await serveReady();
    await migrateAndSeed(localUrl, true);
  }
  ready = true;
  console.log(`[local-pg] ready: http://127.0.0.1:${readyPort}/ready`);
  // Keep the process alive (the HTTP server does this; this covers the EADDRINUSE case).
  setInterval(() => {}, 1 << 30);
} catch (err) {
  console.error('[local-pg] failed to start:', err);
  await shutdown(1);
}
