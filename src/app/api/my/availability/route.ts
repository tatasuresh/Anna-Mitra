import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

type AvailabilityPayload = {
  is_available: boolean;
  need_portions?: number;
  capacity_portions?: number;
  carrying_capacity_portions?: number;
};

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

async function loadAvailability(userId: string, role: string, ngoId: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isAvailable: true, carryingCapacity: true, ngoId: true },
  });
  if (!user) return null;

  if (user.role === 'ngo') {
    const capacity = user.ngoId
      ? await prisma.ngoCapacity.findUnique({ where: { ngoId: user.ngoId } })
      : null;
    const payload: AvailabilityPayload = {
      is_available: user.isAvailable,
      need_portions: capacity?.currentNeedPortions ?? 0,
      capacity_portions: capacity?.capacityPortions ?? 0,
    };
    return payload;
  }

  void role;
  void ngoId;
  return {
    is_available: user.isAvailable,
    carrying_capacity_portions: user.carryingCapacity ?? 0,
  } as AvailabilityPayload;
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, ngoId: true },
  });
  if (!me) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (me.role !== 'ngo' && me.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const availability = await loadAvailability(me.id, me.role, me.ngoId);
    if (!availability) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ availability });
  } catch (e) {
    console.error(e);
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
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  if (input.is_available !== undefined && typeof input.is_available !== 'boolean') {
    return NextResponse.json({ error: 'is_available must be a boolean' }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, ngoId: true },
  });
  if (!me) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (me.role !== 'ngo' && me.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (me.role === 'ngo') {
    const { need_portions, capacity_portions } = input;
    if (need_portions !== undefined && !isNonNegativeInt(need_portions)) {
      return NextResponse.json({ error: 'need_portions must be a whole number of zero or more' }, { status: 400 });
    }
    if (capacity_portions !== undefined && !isNonNegativeInt(capacity_portions)) {
      return NextResponse.json({ error: 'capacity_portions must be a whole number of zero or more' }, { status: 400 });
    }
    if (!me.ngoId) {
      return NextResponse.json({ error: 'Account is not linked to an NGO' }, { status: 409 });
    }
    const ngoId = me.ngoId;

    try {
      if (input.is_available !== undefined) {
        await prisma.user.update({
          where: { id: me.id },
          data: { isAvailable: input.is_available as boolean },
        });
      }

      const capacityData: Prisma.NgoCapacityUncheckedUpdateInput = {};
      if (need_portions !== undefined) capacityData.currentNeedPortions = need_portions as number;
      if (capacity_portions !== undefined) capacityData.capacityPortions = capacity_portions as number;
      if (input.is_available !== undefined) capacityData.isAvailable = input.is_available as boolean;

      if (Object.keys(capacityData).length > 0) {
        await prisma.ngoCapacity.upsert({
          where: { ngoId },
          create: {
            ngoId,
            currentNeedPortions: (need_portions as number | undefined) ?? 0,
            capacityPortions: (capacity_portions as number | undefined) ?? 0,
            isAvailable: (input.is_available as boolean | undefined) ?? true,
          },
          update: capacityData,
        });
      }

      const availability = await loadAvailability(me.id, me.role, me.ngoId);
      if (!availability) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ availability });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      console.error(e);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  const { carrying_capacity_portions } = input;
  if (carrying_capacity_portions !== undefined && !isPositiveInt(carrying_capacity_portions)) {
    return NextResponse.json(
      { error: 'carrying_capacity_portions must be a positive whole number' },
      { status: 400 },
    );
  }

  try {
    const data: Prisma.UserUncheckedUpdateInput = {};
    if (input.is_available !== undefined) data.isAvailable = input.is_available as boolean;
    if (carrying_capacity_portions !== undefined) {
      data.carryingCapacity = carrying_capacity_portions as number;
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: me.id }, data });
    }

    const availability = await loadAvailability(me.id, me.role, me.ngoId);
    if (!availability) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ availability });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}