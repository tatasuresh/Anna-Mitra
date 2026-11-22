import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const volunteer = await prisma.user.findUnique({ where: { id: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (volunteer.role !== 'volunteer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const carryingCapacity = volunteer.carryingCapacity;
    if (
      volunteer.status !== 'approved' ||
      !volunteer.isAvailable ||
      carryingCapacity === null ||
      carryingCapacity === undefined
    ) {
      return NextResponse.json({ pickupTasks: [] });
    }

    const now = new Date();

    const eligibleDonations = await prisma.donation.findMany({
      where: {
        status: 'claimed',
        pickupByAt: { gt: now },
      },
      select: { id: true },
    });

    if (eligibleDonations.length === 0) {
      return NextResponse.json({ pickupTasks: [] });
    }

    const pickupTasks = await prisma.pickupTask.findMany({
      where: {
        volunteerUserId: null,
        donationId: { in: eligibleDonations.map((d) => d.id) },
        portionCount: { lte: carryingCapacity },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}