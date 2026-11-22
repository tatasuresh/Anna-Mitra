import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAdmin(user: { role?: string | null }): boolean {
  return user.role === 'admin';
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ownerUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, ownerUserId, latitude, longitude } = body as {
    name?: unknown;
    ownerUserId?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 120) {
    return NextResponse.json(
      { error: 'Name is required and must be 120 characters or fewer' },
      { status: 400 },
    );
  }

  if (typeof ownerUserId !== 'string' || !UUID_RE.test(ownerUserId)) {
    return NextResponse.json({ error: 'A valid ownerUserId is required' }, { status: 400 });
  }

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return NextResponse.json(
      { error: 'Latitude must be a number between -90 and 90' },
      { status: 400 },
    );
  }

  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: 'Longitude must be a number between -180 and 180' },
      { status: 400 },
    );
  }

  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true, role: true, restaurantId: true },
    });

    if (!owner || owner.role !== 'donor') {
      return NextResponse.json(
        { error: 'Owner must be an existing donor account' },
        { status: 400 },
      );
    }

    const restaurant = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurant.create({
        data: {
          name: name.trim(),
          ownerUserId: owner.id,
          latitude,
          longitude,
          status: 'pending_approval',
        },
      });

      if (!owner.restaurantId) {
        await tx.user.update({
          where: { id: owner.id },
          data: { restaurantId: created.id },
        });
      }

      return created;
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}