import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { accountBlocked, sessionResponse, verifyPassword } from '@/lib/session';

// Rendered by the pipeline: signs a user in with email and password.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: email }, omit: { passwordHash: false } });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  if (accountBlocked(user as unknown as Record<string, unknown>)) {
    return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 });
  }
  const safe: Record<string, unknown> = { ...user };
  delete safe.passwordHash;
  delete safe.tokenVersion;
  return sessionResponse({ user: safe }, { id: String(user.id), email: user.email, role: user.role ? String(user.role) : null });
}
