import { ForbiddenError } from '@mi/auth';
import { toFieldErrors, type ActionResult } from '@mi/db/domain';
import { z } from 'zod';

/** Runs fn; converts ForbiddenError and ZodError into a uniform ActionResult failure. */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return { ok: false, formError: err.message };
    }
    if (err instanceof z.ZodError) {
      return { ok: false, fieldErrors: toFieldErrors(err) };
    }
    if (err instanceof Error) {
      return { ok: false, formError: err.message };
    }
    return { ok: false, formError: 'Something went wrong.' };
  }
}
