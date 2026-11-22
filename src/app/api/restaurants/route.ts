import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const LIST_ROLES = ['ngo', 'volunteer'];
const CREATE_ROLES = ['donor'];
const NAME_MAX_LENGTH = 120;

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const caller = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    });
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!LIST_ROLES.includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await prisma.restaurant.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: 'asc' },
    });

    const restaurants = rows.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }));

    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const rawName = typeof input.name === 'string' ? input.name.trim() : '';
  const latitude = input.latitude;
  const longitude = input.longitude;

  if (!rawName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (rawName.length > NAME_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Name must be ${NAME_MAX_LENGTH} characters or fewer` },
      { status: 400 },
    );
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
    const caller = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, restaurantId: true },
    });
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!CREATE_ROLES.includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (caller.restaurantId) {
      return NextResponse.json(
        { error: 'A restaurant is already linked to this account' },
        { status: 409 },
      );
    }

    const restaurant = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurant.create({
        data: {
          name: rawName,
          ownerUserId: caller.id,
          latitude,
          longitude,
          status: 'pending_approval',
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          status: true,
        },
      });

      await tx.user.update({
        where: { id: caller.id },
        data: { restaurantId: created.id },
      });

      return created;
    });

    return NextResponse.json(
      {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          latitude: Number(restaurant.latitude),
          longitude: Number(restaurant.longitude),
          status: restaurant.status,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}