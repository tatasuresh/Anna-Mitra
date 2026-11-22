import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const publicUserSelect = {
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
} satisfies Prisma.UserSelect;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });
    if (!me) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    return NextResponse.json({ user: me });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = (body ?? {}) as { name?: unknown; email?: unknown };
  const data: { name?: string; email?: string } = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }
    data.name = input.name.trim();
  }

  if (input.email !== undefined) {
    if (typeof input.email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string' }, { status: 400 });
    }
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Email is not valid' }, { status: 400 });
    }
    data.email = email;
  }

  try {
    if (data.email) {
      const taken = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
    }

    if (Object.keys(data).length === 0) {
      const me = await prisma.user.findUnique({
        where: { id: user.id },
        select: publicUserSelect,
      });
      if (!me) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ user: me });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: publicUserSelect,
    });
    return NextResponse.json({ user: updated });
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