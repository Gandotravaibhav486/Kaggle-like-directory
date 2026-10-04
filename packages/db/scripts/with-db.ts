import { createDb, createPostgresClient } from '../src/client';
import type { Db } from '../src/client';
import { loadRootEnv } from '../src/env';
import { canConnect, localPgConfig, startEmbedded, type StartedPg } from './embedded';

export interface WithDbContext {
  url: string;
  /** 'remote' = DATABASE_URL; 'running' = local server already up; 'embedded' = started for this command. */
  mode: 'remote' | 'running' | 'embedded';
}

/**
 * Runs fn against DATABASE_URL if set; otherwise against the local server if it is running;
 * otherwise starts embedded Postgres in-process on the same data dir for the duration of fn.
 */
export async function withDb<T>(fn: (db: Db, ctx: WithDbContext) => Promise<T>): Promise<T> {
  loadRootEnv();
  let started: StartedPg | undefined;
  let ctx: WithDbContext;
  const remote = process.env.DATABASE_URL?.trim();
  if (remote) {
    ctx = { url: remote, mode: 'remote' };
  } else {
    const { dir, port, url } = localPgConfig();
    if (await canConnect(url)) {
      ctx = { url, mode: 'running' };
    } else {
      started = await startEmbedded({ dir, port });
      ctx = { url, mode: 'embedded' };
    }
  }
  const client = createPostgresClient(ctx.url, { max: 2 });
  try {
    return await fn(createDb(client), ctx);
  } finally {
    await client.end({ timeout: 5 });
    if (started) await started.stop();
  }
}

export function describeTarget(ctx: WithDbContext): string {
  const safe = ctx.url.replace(/\/\/([^:@/]+):[^@/]*@/, '//$1:***@');
  return `${safe} (${ctx.mode})`;
}

export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}
