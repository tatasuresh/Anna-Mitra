import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

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

    // Only approved, available volunteers with a declared carrying capacity see open pickups.
    if (
      volunteer.status !== 'approved' ||
      !volunteer.isAvailable ||
      volunteer.carryingCapacity === null
    ) {
      return NextResponse.json({ pickupTasks: [] });
    }

    const now = new Date();

    const candidates = await prisma.pickupTask.findMany({
      where: {
        status: 'open',
        volunteerUserId: null,
        portionCount: { lte: volunteer.carryingCapacity },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ pickupTasks: [] });
    }

    const donationIds = Array.from(new Set(candidates.map((t) => t.donationId)));
    const claimIds = Array.from(new Set(candidates.map((t) => t.claimId)));

    const [donations, claims] = await Promise.all([
      prisma.donation.findMany({
        where: { id: { in: donationIds }, pickupByAt: { gt: now } },
        select: { id: true },
      }),
      prisma.donationClaim.findMany({
        where: { id: { in: claimIds }, status: 'confirmed' },
        select: { id: true },
      }),
    ]);

    const openDonationIds = new Set(donations.map((d) => d.id));
    const confirmedClaimIds = new Set(claims.map((c) => c.id));

    const pickupTasks = candidates.filter(
      (t) => openDonationIds.has(t.donationId) && confirmedClaimIds.has(t.claimId),
    );

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}