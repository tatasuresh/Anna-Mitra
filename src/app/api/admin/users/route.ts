import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, hashPassword } from '@/lib/session';

const ROLES = ['donor', 'ngo', 'volunteer', 'admin', 'csr_sponsor'] as const;
const STATUSES = ['pending_approval', 'approved', 'suspended'] as const;

type Role = (typeof ROLES)[number];
type Status = (typeof STATUSES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

const userSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  email: true,
  role: true,
  status: true,
  isDemo: true,
  restaurantId: true,
  ngoId: true,
  isAvailable: true,
  carryingCapacity: true,
  decidedAt: true,
  decidedByUserId: true,
  lastSignedOutAt: true,
  organisationName: true,
  passwordChangedAt: true,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Confirms the signed-in caller is an existing admin; returns the admin id or an error response. */
async function requireAdmin(request: Request): Promise<{ id: string } | Response> {
  const sessionUser = await requireUser(request);
  if (sessionUser instanceof Response) return sessionUser;

  const caller = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  });
  if (!caller) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  if (caller.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }
  return { id: caller.id };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get('account_status') ?? searchParams.get('status');
  const rawRole = searchParams.get('role');

  if (rawStatus && !isStatus(rawStatus)) {
    return NextResponse.json({ error: 'Invalid account_status filter' }, { status: 400 });
  }
  if (rawRole && !isRole(rawRole)) {
    return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        ...(rawStatus && isStatus(rawStatus) ? { status: rawStatus } : {}),
        ...(rawRole && isRole(rawRole) ? { role: rawRole } : {}),
      },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (e) {
    console.error('GET /api/admin/users failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const role = input.role;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email, password, role' },
      { status: 400 },
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        status: 'approved',
        decidedAt: new Date(),
        decidedByUserId: admin.id,
      },
      select: userSelect,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('POST /api/admin/users failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}