// Shared flat ESLint config for the Next.js apps: base rules + eslint-config-next
// (core-web-vitals + typescript). eslint-config-next 16 ships flat configs.
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import base from './base.mjs';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...base,
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react 7.x calls context.getFilename() (removed in ESLint 10) when the
    // React version is 'detect'. Pinning the version avoids that code path.
    settings: { react: { version: '19.3' } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
];

export default config;
