import { DEFAULT_COMPETITION_SLUG } from '@mi/db/domain';

export const ARENA_URL = process.env.ARENA_URL ?? 'http://localhost:3000';
export const LAB_URL = process.env.LAB_URL ?? 'http://localhost:3001';
export const DEFAULT_SLUG = process.env.DEFAULT_COMPETITION_SLUG ?? DEFAULT_COMPETITION_SLUG;
