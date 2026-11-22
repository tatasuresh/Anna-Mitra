import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const NGO_STATUSES = ['pending_approval', 'approved', 'suspended'] as const;
type NgoStatusValue = (typeof NGO_STATUSES)[number];

interface DecimalLike {
  toString(): string;
}

interface NgoRow {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  latitude: DecimalLike;
  longitude: DecimalLike;
  serviceRadiusKm: DecimalLike;
  status: string;
}

function serializeNgo(ngo: NgoRow) {
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

function isNgoStatus(value: string): value is NgoStatusValue {
  return (NGO_STATUSES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const statusParam = new URL(request.url).searchParams.get('status');
  if (statusParam !== null && statusParam !== '' && !isNgoStatus(statusParam)) {
    return NextResponse.json(
      { error: `status must be one of: ${NGO_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const rows = await prisma.ngo.findMany({
      where: statusParam && isNgoStatus(statusParam) ? { status: statusParam } : undefined,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ ngos: rows.map(serializeNgo) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const latitude = input.latitude;
  const longitude = input.longitude;
  const radiusRaw = input.serviceRadiusKm ?? input.service_radius_km;

  const missing: string[] = [];
  if (!name) missing.push('name');
  if (latitude === undefined || latitude === null) missing.push('latitude');
  if (longitude === undefined || longitude === null) missing.push('longitude');
  if (radiusRaw === undefined || radiusRaw === null) missing.push('service_radius_km');
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: 'latitude must be a number between -90 and 90' }, { status: 400 });
  }
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'longitude must be a number between -180 and 180' }, { status: 400 });
  }
  if (typeof radiusRaw !== 'number' || !Number.isFinite(radiusRaw) || radiusRaw <= 0) {
    return NextResponse.json({ error: 'service_radius_km must be a number greater than 0' }, { status: 400 });
  }

  try {
    const ngo = await prisma.ngo.create({
      data: {
        name,
        latitude,
        longitude,
        serviceRadiusKm: radiusRaw,
        status: 'pending_approval',
      },
    });
    return NextResponse.json({ ngo: serializeNgo(ngo) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}