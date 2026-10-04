import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '../../src/client';
import { prospectInputSchema } from '../../src/domain/validation';
import {
  createSeason,
  deleteProspect,
  getCompetitionBySlug,
  getProspect,
  listProspects,
  NotFoundError,
  upsertProspect,
} from '../../src/queries';
import { freshDb } from './helpers';

let db: Db;
let close: () => Promise<void>;
let compId: string;
let otherCompId: string;

beforeAll(async () => {
  ({ db, close } = await freshDb());
  compId = (await getCompetitionBySlug(db, 'mock-interview-v5'))!.id;
  otherCompId = (await createSeason(db, { slug: 'pipeline-other', title: 'Other season', tagline: '', startsOn: null, endsOn: null, currency: 'INR' }, 'owner@example.com')).id;
});
afterAll(async () => close());

describe('pipeline queries', () => {
  it('inserts, updates and deletes, scoped to the competition', async () => {
    const input = prospectInputSchema.parse({ company: 'Acme Campus', emailedOn: '2026-09-01', channel: 'LinkedIn' });
    const created = await upsertProspect(db, compId, input);
    expect(created).toMatchObject({ company: 'Acme Campus', repliedOn: null, contractValueMinor: null });

    const won = prospectInputSchema.parse({
      company: 'Acme Campus',
      emailedOn: '2026-09-01',
      repliedOn: '2026-09-03',
      wonOn: '2026-09-25',
      contractValue: '40000',
    });
    const updated = await upsertProspect(db, compId, won, created.id);
    expect(updated.contractValueMinor).toBe(4_000_000);

    // Another season cannot see or touch it.
    expect(await listProspects(db, otherCompId)).toHaveLength(0);
    expect(await getProspect(db, otherCompId, created.id)).toBeNull();
    await expect(upsertProspect(db, otherCompId, won, created.id)).rejects.toBeInstanceOf(NotFoundError);
    await deleteProspect(db, otherCompId, created.id);
    expect(await getProspect(db, compId, created.id)).not.toBeNull();

    await deleteProspect(db, compId, created.id);
    expect(await getProspect(db, compId, created.id)).toBeNull();
  });

  it('lists newest outreach first', async () => {
    await upsertProspect(db, compId, prospectInputSchema.parse({ company: 'Older', emailedOn: '2026-08-01' }));
    await upsertProspect(db, compId, prospectInputSchema.parse({ company: 'Newer', emailedOn: '2026-09-15' }));
    const names = (await listProspects(db, compId)).map((p) => p.company);
    expect(names.indexOf('Newer')).toBeLessThan(names.indexOf('Older'));
  });
});
