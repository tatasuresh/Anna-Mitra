import { NextResponse } from 'next/server';
import { clearSession, endSessions, getSessionUser } from '@/lib/session';

// Rendered by the pipeline: ends the session, and every other session of the
// person signing out, so a copied token stops working too.
export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (user) await endSessions(user.id);
  return clearSession(NextResponse.json({ ok: true }));
}

export const DELETE = POST;
