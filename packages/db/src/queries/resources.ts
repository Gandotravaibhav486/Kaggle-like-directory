import { asc, eq, sql } from 'drizzle-orm';
import type { Db } from '../client';
import type { ResourceInput } from '../domain/validation';
import { resources, type Resource } from '../schema';
import { NotFoundError } from './errors';

export async function listResources(db: Db, competitionId: string): Promise<Resource[]> {
  return db
    .select()
    .from(resources)
    .where(eq(resources.competitionId, competitionId))
    .orderBy(asc(resources.position), asc(resources.createdAt));
}

export async function getResource(db: Db, id: string): Promise<Resource | null> {
  const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return row ?? null;
}

export async function createResource(db: Db, competitionId: string, input: ResourceInput): Promise<Resource> {
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql<number>`coalesce(max(${resources.position}), -1) + 1` })
    .from(resources)
    .where(eq(resources.competitionId, competitionId));
  const [row] = await db
    .insert(resources)
    .values({
      competitionId,
      name: input.name,
      kind: input.kind,
      url: input.url ?? null,
      usedFor: input.usedFor,
      notes: input.notes ?? '',
      position: Number(next),
    })
    .returning();
  return row!;
}

export async function updateResource(db: Db, id: string, input: ResourceInput): Promise<Resource> {
  const [row] = await db
    .update(resources)
    .set({
      name: input.name,
      kind: input.kind,
      url: input.url ?? null,
      usedFor: input.usedFor,
      notes: input.notes ?? '',
      updatedAt: new Date(),
    })
    .where(eq(resources.id, id))
    .returning();
  if (!row) throw new NotFoundError('Resource');
  return row;
}

export async function deleteResource(db: Db, id: string): Promise<void> {
  await db.delete(resources).where(eq(resources.id, id));
}
