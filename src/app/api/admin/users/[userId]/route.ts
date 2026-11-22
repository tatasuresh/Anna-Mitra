import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ['donor', 'ngo', 'volunteer', 'admin', 'csr_sponsor'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

type RouteContext = { params: Promise<{ userId: string }> };

async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const { userId } = await context.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data: { name?: string; email?: string; role?: (typeof ROLES)[number] } = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.trim().length > 200) {
      return NextResponse.json({ error: 'Name must be 1 to 200 characters' }, { status: 400 });
    }
    data.name = input.name.trim();
  }

  if (input.email !== undefined) {
    if (typeof input.email !== 'string' || !EMAIL_RE.test(input.email.trim())) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    data.email = input.email.trim().toLowerCase();
  }

  if (input.role !== undefined) {
    if (typeof input.role !== 'string' || !(ROLES as readonly string[]).includes(input.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    data.role = input.role as (typeof ROLES)[number];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}