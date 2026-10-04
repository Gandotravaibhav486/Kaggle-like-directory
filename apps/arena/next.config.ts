import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.resolve(dirname, '../..'));

const nextConfig: NextConfig = {
  transpilePackages: ['@mi/ui', '@mi/auth', '@mi/db'],
  // Monorepo: trace files from the repo root so workspace packages (and their
  // node_modules) are included in the Vercel serverless function bundle.
  outputFileTracingRoot: path.resolve(dirname, '../..'),
};

export default nextConfig;
