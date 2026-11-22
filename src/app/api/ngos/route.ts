import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const ALLOWED_ROLES = ['donor', 'ngo', 'volunteer'];

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (!user.role || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.ngo.findMany({
      where: { status: 'approved' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
        status: true,
      },
    });

    const ngos = rows.map((ngo) => ({
      id: ngo.id,
      createdAt: ngo.createdAt.toISOString(),
      updatedAt: ngo.updatedAt.toISOString(),
      name: ngo.name,
      latitude: Number(ngo.latitude),
      longitude: Number(ngo.longitude),
      serviceRadiusKm: Number(ngo.serviceRadiusKm),
      status: ngo.status,
    }));

    return NextResponse.json({ ngos });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}