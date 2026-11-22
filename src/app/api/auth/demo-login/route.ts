import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sessionResponse } from '@/lib/session';

const ROLES = ['donor', 'ngo', 'volunteer', 'admin', 'csr_sponsor'] as const;
type DemoRole = (typeof ROLES)[number];

function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  if (process.env.DEMO_ACCOUNTS_ENABLED === 'false') {
    return NextResponse.json({ error: 'Demo accounts are disabled' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const role = (body as { role?: unknown } | null)?.role;
  if (!isDemoRole(role)) {
    return NextResponse.json(
      { error: 'Role must be one of: donor, ngo, volunteer, admin, csr_sponsor' },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.user.findFirst({
      where: { role, isDemo: true, status: 'approved' },
      orderBy: { createdAt: 'asc' },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'No demo account is available for this role' },
        { status: 404 },
      );
    }

    const {
      passwordHash: _passwordHash,
      sessionToken: _sessionToken,
      ...publicUser
    } = account;

    return sessionResponse({ user: publicUser }, account);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}