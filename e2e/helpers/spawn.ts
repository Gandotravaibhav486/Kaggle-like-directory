import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForHealthy } from './db-ready';
import { APP_ENV, ARENA_RESTART_PORT } from './env';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export interface SpawnedServer {
  url: string;
  process: ChildProcess;
  stop: () => Promise<void>;
}

/**
 * Starts a fresh `next start` process for the (already built) arena app, with the e2e env.
 * Used by the persistence spec to prove data survives a server restart.
 */
export async function startArena(port = ARENA_RESTART_PORT, env: Record<string, string> = {}): Promise<SpawnedServer> {
  return startApp('@mi/arena', port, env);
}

export async function startApp(pkg: '@mi/arena' | '@mi/lab', port: number, env: Record<string, string> = {}): Promise<SpawnedServer> {
  const child = spawn('pnpm', ['--filter', pkg, 'exec', 'next', 'start', '-p', String(port)], {
    cwd: repoRoot,
    env: { ...process.env, ...APP_ENV, ...env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true, // own process group so stop() kills pnpm and next together
  });
  let output = '';
  child.stdout?.on('data', (d) => (output += d));
  child.stderr?.on('data', (d) => (output += d));
  const url = `http://localhost:${port}`;
  const stop = async () => {
    if (child.exitCode !== null || child.pid === undefined) return;
    const exited = new Promise<void>((r) => child.once('exit', () => r()));
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid!, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }, 10_000);
    await exited;
    clearTimeout(timer);
  };
  try {
    await waitForHealthy(url, 90_000);
  } catch (err) {
    await stop();
    throw new Error(`${pkg} on ${port} did not start: ${(err as Error).message}\n${output.slice(-2000)}`);
  }
  return { url, process: child, stop };
}
