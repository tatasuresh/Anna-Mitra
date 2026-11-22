import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { Restaurant } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toWire(r: Restaurant) {
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

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'ngo' && user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { restaurantId } = await params;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, status: 'approved' },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ restaurant: toWire(restaurant) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { restaurantId } = await params;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;

  const data: Prisma.RestaurantUpdateInput = {};

  if ('name' in raw) {
    if (typeof raw.name !== 'string' || raw.name.trim().length === 0 || raw.name.trim().length > 120) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 120 characters.' },
        { status: 400 },
      );
    }
    data.name = raw.name.trim();
  }

  if ('latitude' in raw) {
    if (typeof raw.latitude !== 'number' || !Number.isFinite(raw.latitude) || raw.latitude < -90 || raw.latitude > 90) {
      return NextResponse.json({ error: 'Latitude must be a number between -90 and 90.' }, { status: 400 });
    }
    data.latitude = new Prisma.Decimal(raw.latitude);
  }

  if ('longitude' in raw) {
    if (typeof raw.longitude !== 'number' || !Number.isFinite(raw.longitude) || raw.longitude < -180 || raw.longitude > 180) {
      return NextResponse.json({ error: 'Longitude must be a number between -180 and 180.' }, { status: 400 });
    }
    data.longitude = new Prisma.Decimal(raw.longitude);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const owned = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerUserId: user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });
    return NextResponse.json({ restaurant: toWire(updated) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}