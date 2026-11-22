import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

type RouteContext = { params: Promise<{ ngoCapacityId: string }> };

const PORTIONS_ERROR = 'Enter a whole number of portions between 0 and the allowed maximum.';
const AVAILABILITY_ERROR = 'Choose whether the NGO is accepting donations or paused.';

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  try {
    const ngoCapacity = await prisma.ngoCapacity.findUnique({
      where: { id: params.ngoCapacityId },
    });
    if (!ngoCapacity) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ngoCapacity });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data: Partial<{
    currentNeedPortions: number;
    capacityPortions: number;
    maxPortionsPerClaim: number;
    hasColdStorage: boolean;
    isAvailable: boolean;
  }> = {};

  if ('currentNeedPortions' in body) {
    if (!isNonNegativeInt(body.currentNeedPortions)) {
      return NextResponse.json({ error: PORTIONS_ERROR }, { status: 400 });
    }
    data.currentNeedPortions = body.currentNeedPortions;
  }
  if ('capacityPortions' in body) {
    if (!isNonNegativeInt(body.capacityPortions)) {
      return NextResponse.json({ error: PORTIONS_ERROR }, { status: 400 });
    }
    data.capacityPortions = body.capacityPortions;
  }
  if ('maxPortionsPerClaim' in body) {
    if (!isNonNegativeInt(body.maxPortionsPerClaim)) {
      return NextResponse.json({ error: PORTIONS_ERROR }, { status: 400 });
    }
    data.maxPortionsPerClaim = body.maxPortionsPerClaim;
  }
  if ('hasColdStorage' in body) {
    if (typeof body.hasColdStorage !== 'boolean') {
      return NextResponse.json({ error: 'Invalid hasColdStorage value' }, { status: 400 });
    }
    data.hasColdStorage = body.hasColdStorage;
  }
  if ('isAvailable' in body) {
    if (typeof body.isAvailable !== 'boolean') {
      return NextResponse.json({ error: AVAILABILITY_ERROR }, { status: 400 });
    }
    data.isAvailable = body.isAvailable;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  try {
    const existing = await prisma.ngoCapacity.findUnique({
      where: { id: params.ngoCapacityId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const effectiveCapacity = data.capacityPortions ?? existing.capacityPortions;
    const effectiveMaxPerClaim = data.maxPortionsPerClaim ?? existing.maxPortionsPerClaim;
    if (effectiveMaxPerClaim > effectiveCapacity) {
      return NextResponse.json(
        { error: 'Maximum portions per claim cannot be above capacity portions.' },
        { status: 400 },
      );
    }

    const ngoCapacity = await prisma.ngoCapacity.update({
      where: { id: params.ngoCapacityId },
      data,
    });
    return NextResponse.json({ ngoCapacity });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}