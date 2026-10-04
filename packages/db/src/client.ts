import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Schema = typeof schema;
/** Common supertype of the postgres-js (apps, scripts) and PGlite (tests) drizzle databases. */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

export const DEFAULT_LOCAL_PG_PORT = 54329;

export function localPgPort(): number {
  const raw = process.env.LOCAL_PG_PORT?.trim();
  const n = raw ? Number(raw) : DEFAULT_LOCAL_PG_PORT;
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_LOCAL_PG_PORT;
}

/** DATABASE_URL when set (non-empty), else the local embedded Postgres URL. */
export function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  return `postgres://postgres:postgres@127.0.0.1:${localPgPort()}/postgres`;
}

export function createPostgresClient(url = resolveDatabaseUrl(), opts: { max?: number } = {}) {
  return postgres(url, {
    prepare: false,
    max: opts.max ?? (process.env.VERCEL ? 1 : 5),
    idle_timeout: 20,
    onnotice: () => {},
  });
}

export function createDb(client: postgres.Sql): Db {
  return drizzle({ client, schema, casing: undefined }) as unknown as Db;
}

interface Cached {
  db: Db;
  client: postgres.Sql;
}

const g = globalThis as typeof globalThis & { __miDb?: Cached };

/** Lazy singleton (cached on globalThis so it survives Next HMR). Does not connect until first query. */
export function getDb(): Db {
  if (!g.__miDb) {
    const client = createPostgresClient();
    g.__miDb = { client, db: createDb(client) };
  }
  return g.__miDb.db;
}

export async function closeDb(): Promise<void> {
  const cached = g.__miDb;
  g.__miDb = undefined;
  if (cached) await cached.client.end({ timeout: 5 });
}
