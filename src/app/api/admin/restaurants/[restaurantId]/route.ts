import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type RouteContext = { params: Promise<{ restaurantId: string }> };

const restaurantInclude = {
  ownerUser: { select: { id: true, name: true, email: true, role: true, status: true } },
  preference: true,
} as const;

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.restaurantId },
      include: restaurantInclude,
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ restaurant });
  } catch (e) {
    console.error('GET /api/admin/restaurants/[restaurantId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data: { name?: string; latitude?: number; longitude?: number } = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }
    data.name = input.name.trim();
  }

  if (input.latitude !== undefined) {
    if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
      return NextResponse.json({ error: 'Latitude must be a number between -90 and 90' }, { status: 400 });
    }
    data.latitude = input.latitude;
  }

  if (input.longitude !== undefined) {
    if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
      return NextResponse.json({ error: 'Longitude must be a number between -180 and 180' }, { status: 400 });
    }
    data.longitude = input.longitude;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: params.restaurantId },
      data,
      include: restaurantInclude,
    });
    return NextResponse.json({ restaurant });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('PATCH /api/admin/restaurants/[restaurantId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}