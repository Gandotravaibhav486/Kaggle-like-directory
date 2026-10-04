import { defineConfig } from 'drizzle-kit';
import { resolveDatabaseUrl } from './src/client';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: resolveDatabaseUrl() },
});
