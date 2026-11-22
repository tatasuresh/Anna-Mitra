// Sessions for this app — rendered by the pipeline. Every route signs people in,
// reads who they are, and signs them out through THIS module; none handles tokens
// itself. Stateless: a signed JWT, so a session survives restarts and serverless.
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'app_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: string;
  email: string;
  role?: string | null;
  name?: string | null;
  /** The account's session counter when the token is signed (never sent back). */
  tokenVersion?: number;
}

const BLOCKED_STATUS = new Set(['suspended', 'deactivated', 'disabled', 'banned', 'blocked', 'inactive', 'deleted', 'rejected']);

/** Whether an account row may NOT sign in or act: switched off (`active` /
 *  `isActive` / `enabled` false), deactivated, deleted or banned, or a blocking
 *  status. One rule for the sign-in route and for every request. */
export function accountBlocked(row: Record<string, unknown>): boolean {
  if (row.active === false || row.isActive === false || row.enabled === false) return true;
  if (row.deactivatedAt || row.deletedAt || row.bannedAt) return true;
  return BLOCKED_STATUS.has(String(row.status ?? row.accountStatus ?? '').toLowerCase());
}

/** The account behind a session, re-read on every request — a signed token alone
 *  outlives a deleted or deactivated account (measured: a deactivated trainer kept
 *  signing in and calling the API), and a changed role would wait for the next
 *  sign-in. `false` = no access; `null` = could not check (no user table, a
 *  database hiccup): trust the token. */
async function loadAccount(id: string): Promise<{ email?: string; role?: string | null; name?: string | null; tokenVersion?: number } | null | false> {
  const users = (prisma as unknown as Record<string, { findUnique?: (a: unknown) => Promise<Record<string, unknown> | null> }>).user;
  if (!users || typeof users.findUnique !== 'function') return null;
  try {
    const row = await users.findUnique({ where: { id } });
    if (!row || accountBlocked(row)) return false;
    return {
      email: typeof row.email === 'string' ? row.email : undefined,
      role: row.role != null ? String(row.role) : null,
      name: typeof row.name === 'string' ? row.name : typeof row.fullName === 'string' ? row.fullName : null,
      tokenVersion: typeof row.tokenVersion === 'number' ? row.tokenVersion : undefined,
    };
  } catch {
    return null;
  }
}

/** Ends every session of this account: tokens signed before now stop working,
 *  not only this browser's cookie (a signed-out token used to work for 7 days). */
export async function endSessions(id: string): Promise<void> {
  const users = (prisma as unknown as Record<string, { update?: (a: unknown) => Promise<unknown> }>).user;
  if (!users || typeof users.update !== 'function') return;
  try {
    await users.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
  } catch {
    // No tokenVersion column (or no such account): the cookie is all there is to end.
  }
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET is not set — add it to .env');
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser): Promise<string> {
  // The account's session counter, so signing out (endSessions) ends this token too.
  const tv = typeof user.tokenVersion === 'number' ? user.tokenVersion
    : ((await loadAccount(String(user.id))) || undefined)?.tokenVersion;
  return new SignJWT({ email: user.email, ...(user.role ? { role: user.role } : {}), ...(typeof tv === 'number' ? { tv } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

/** The token: the Bearer header first — the IDE preview runs the app in a
 *  cross-site iframe, where the cookie is not sent — then the cookie. */
async function readToken(request?: Request): Promise<string | null> {
  const header = request?.headers.get('authorization') ?? (await headers()).get('authorization');
  if (header && header.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Who is signed in, or null. */
export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  // nexen:mock-auth: preview only — the IDE sets MOCK_MODE when it boots the dev
  // server, so protected pages render without a real login. Removed by strip-mocks.
  if (process.env.MOCK_MODE === 'true') {
    return {"id": "00000000-0000-4000-8000-000000000001", "email": "demo@example.com", "role": "admin"};
  }
  const token = await readToken(request);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    const account = await loadAccount(payload.sub);
    if (account === false) return null;
    // Signed out since this token was made (a token from before the counter is 0).
    if (account && typeof account.tokenVersion === 'number'
        && account.tokenVersion !== (typeof payload.tv === 'number' ? payload.tv : 0)) return null;
    return {
      id: payload.sub,
      email: account?.email ?? (typeof payload.email === 'string' ? payload.email : ''),
      role: account ? account.role ?? null : typeof payload.role === 'string' ? payload.role : null,
      name: account?.name ?? null,
    };
  } catch {
    return null;
  }
}

/** The signed-in user, or a 401 response to return as it is:
 *
 *    const user = await requireUser(request);
 *    if (user instanceof Response) return user;
 */
export async function requireUser(request?: Request): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser(request);
  return user ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** A JSON response that starts a session: the httpOnly cookie AND `token` in the
 *  body, which the client keeps and sends back as a Bearer header. */
export async function sessionResponse(
  body: Record<string, unknown>,
  user: SessionUser,
  init?: ResponseInit,
): Promise<NextResponse> {
  const token = await signSession(user);
  const response = NextResponse.json({ ...body, token }, init);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

/** Ends the session on `response`. */
export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
