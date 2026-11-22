import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type RestaurantRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  ownerUserId: string;
  latitude: { toNumber(): number };
  longitude: { toNumber(): number };
  status: string;
};

function toRestaurantJson(r: RestaurantRecord) {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    name: r.name,
    ownerUserId: r.ownerUserId,
    latitude: r.latitude.toNumber(),
    longitude: r.longitude.toNumber(),
    status: r.status,
  };
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.restaurant.findMany({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ restaurants: rows.map((r) => toRestaurantJson(r as RestaurantRecord)) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const latitude = typeof input.latitude === 'number' ? input.latitude : NaN;
  const longitude = typeof input.longitude === 'number' ? input.longitude : NaN;

  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Restaurant name is required (120 characters or fewer)' }, { status: 400 });
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: 'Latitude must be a number between -90 and 90' }, { status: 400 });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Longitude must be a number between -180 and 180' }, { status: 400 });
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, status: true },
    });
    if (!account) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (account.status !== 'approved') {
      return NextResponse.json({ error: 'Account is not approved' }, { status: 403 });
    }

    const existing = await prisma.restaurant.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: 'A restaurant already exists for this donor' }, { status: 409 });
    }

    const restaurant = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurant.create({
        data: {
          name,
          ownerUserId: user.id,
          latitude,
          longitude,
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { restaurantId: created.id },
      });
      return created;
    });

    return NextResponse.json({ restaurant: toRestaurantJson(restaurant as RestaurantRecord) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}