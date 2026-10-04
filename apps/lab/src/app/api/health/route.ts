import { ping } from '@mi/db/queries';
import { db } from '@/lib/db';

export async function GET() {
  const ok = await ping(db);
  return Response.json({ ok }, { status: ok ? 200 : 503 });
}
