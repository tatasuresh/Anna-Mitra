import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const ALLOWED_ROLES = ['donor', 'ngo', 'volunteer', 'admin'];

async function isInvolvedInDonation(
  donationId: string,
  dbUser: { id: string; role: string; ngoId: string | null },
  ownerUserId: string,
): Promise<boolean> {
  if (dbUser.role === 'admin') return true;

  if (dbUser.role === 'donor') {
    return ownerUserId === dbUser.id;
  }

  if (dbUser.role === 'ngo') {
    const claim = await prisma.donationClaim.findFirst({
      where: {
        donationId,
        OR: [
          { claimedByUserId: dbUser.id },
          ...(dbUser.ngoId ? [{ ngoId: dbUser.ngoId }] : []),
        ],
      },
      select: { id: true },
    });
    return claim !== null;
  }

  if (dbUser.role === 'volunteer') {
    const task = await prisma.pickupTask.findFirst({
      where: { donationId, volunteerUserId: dbUser.id },
      select: { id: true },
    });
    return task !== null;
  }

  return false;
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const { donationId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, ngoId: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: {
        id: true,
        restaurant: { select: { ownerUserId: true } },
      },
    });
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const involved = await isInvolvedInDonation(
      donationId,
      dbUser,
      donation.restaurant.ownerUserId,
    );
    if (!involved) {
      return NextResponse.json(
        { error: 'You are not involved in this donation' },
        { status: 403 },
      );
    }

    const pickupTasks = await prisma.pickupTask.findMany({
      where: { donationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}