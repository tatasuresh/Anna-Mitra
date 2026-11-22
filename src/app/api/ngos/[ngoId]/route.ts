import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ROLES = ['donor', 'ngo', 'volunteer'];

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ ngoId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const role = user.role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ngoId } = await params;
  if (!UUID_PATTERN.test(ngoId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });

    if (!ngo || ngo.status !== 'approved') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      ngo: {
        id: ngo.id,
        createdAt: ngo.createdAt,
        updatedAt: ngo.updatedAt,
        name: ngo.name,
        latitude: Number(ngo.latitude),
        longitude: Number(ngo.longitude),
        serviceRadiusKm: Number(ngo.serviceRadiusKm),
        status: ngo.status,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}