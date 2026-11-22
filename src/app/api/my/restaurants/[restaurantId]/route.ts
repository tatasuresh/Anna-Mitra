import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadOwnedRestaurant(restaurantId: string, userId: string) {
  return prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerUserId: userId },
    include: { preference: true },
  });
}

async function requireDonor(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (dbUser.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireDonor(request);
  if (user instanceof Response) return user;

  const restaurantId = params.restaurantId;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const restaurant = await loadOwnedRestaurant(restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ restaurant });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireDonor(request);
  if (user instanceof Response) return user;

  const restaurantId = params.restaurantId;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;

  // Only these fields are donor-editable. status and ownerUserId are ignored.
  const data: { name?: string; latitude?: number; longitude?: number } = {};

  if ('name' in body) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.trim().length > 120) {
      return NextResponse.json(
        { error: 'Restaurant name must be between 1 and 120 characters.' },
        { status: 400 }
      );
    }
    data.name = body.name.trim();
  }

  if ('latitude' in body) {
    if (typeof body.latitude !== 'number' || !Number.isFinite(body.latitude) || body.latitude < -90 || body.latitude > 90) {
      return NextResponse.json({ error: 'Latitude must be a number between -90 and 90.' }, { status: 400 });
    }
    data.latitude = body.latitude;
  }

  if ('longitude' in body) {
    if (typeof body.longitude !== 'number' || !Number.isFinite(body.longitude) || body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json({ error: 'Longitude must be a number between -180 and 180.' }, { status: 400 });
    }
    data.longitude = body.longitude;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const owned = await prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerUserId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    const restaurant = await loadOwnedRestaurant(restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ restaurant });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}