import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pickupTasks = await prisma.pickupTask.findMany({
      where: { volunteerUserId: user.id },
      orderBy: { acceptedAt: 'desc' },
    });

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}