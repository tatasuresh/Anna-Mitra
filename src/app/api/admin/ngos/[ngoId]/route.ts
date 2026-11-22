import { NextRequest, NextResponse } from 'next/server';
import { Prisma, NgoStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const NGO_STATUSES: readonly NgoStatus[] = ['pending_approval', 'approved', 'suspended'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NgoRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  serviceRadiusKm: Prisma.Decimal;
  status: NgoStatus;
};

function serializeNgo(ngo: NgoRecord) {
  return {
    id: ngo.id,
    createdAt: ngo.createdAt.toISOString(),
    updatedAt: ngo.updatedAt.toISOString(),
    name: ngo.name,
    latitude: Number(ngo.latitude.toString()),
    longitude: Number(ngo.longitude.toString()),
    serviceRadiusKm: Number(ngo.serviceRadiusKm.toString()),
    status: ngo.status,
  };
}

async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ ngoId: string }> }
) {
  const params = await paramsPromise;
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  const { ngoId } = params;
  if (!UUID_RE.test(ngoId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });
    if (!ngo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ngo: serializeNgo(ngo) });
  } catch (e) {
    console.error('GET /api/admin/ngos/[ngoId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ ngoId: string }> }
) {
  const params = await paramsPromise;
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  const { ngoId } = params;
  if (!UUID_RE.test(ngoId)) {
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

  const data: Prisma.NgoUpdateInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
    }
    data.name = input.name.trim();
  }

  if (input.latitude !== undefined) {
    if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
      return NextResponse.json({ error: 'latitude must be a number between -90 and 90' }, { status: 400 });
    }
    data.latitude = input.latitude;
  }

  if (input.longitude !== undefined) {
    if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
      return NextResponse.json({ error: 'longitude must be a number between -180 and 180' }, { status: 400 });
    }
    data.longitude = input.longitude;
  }

  if (input.serviceRadiusKm !== undefined) {
    if (typeof input.serviceRadiusKm !== 'number' || !Number.isFinite(input.serviceRadiusKm) || input.serviceRadiusKm <= 0) {
      return NextResponse.json({ error: 'serviceRadiusKm must be a number greater than 0' }, { status: 400 });
    }
    data.serviceRadiusKm = input.serviceRadiusKm;
  }

  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !NGO_STATUSES.includes(input.status as NgoStatus)) {
      return NextResponse.json({ error: 'status must be one of pending_approval, approved, suspended' }, { status: 400 });
    }
    data.status = input.status as NgoStatus;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const ngo = await prisma.ngo.update({
      where: { id: ngoId },
      data,
    });
    return NextResponse.json({ ngo: serializeNgo(ngo) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('PATCH /api/admin/ngos/[ngoId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}