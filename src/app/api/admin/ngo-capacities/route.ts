
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ngoCapacities = await prisma.ngoCapacity.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        ngo: { select: { id: true, name: true, status: true } },
      },
    });

    return NextResponse.json({ ngoCapacities });
  } catch (error) {
    console.error('GET /api/admin/ngo-capacities failed', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}