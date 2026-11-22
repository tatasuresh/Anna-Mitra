import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const donationId = params.donationId;

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { restaurant: true },
    });

    if (!donation || donation.restaurant.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (donation.status !== 'draft' && donation.status !== 'published') {
      return NextResponse.json(
        { error: 'Only draft or published donations without a claim can be cancelled' },
        { status: 409 },
      );
    }

    const activeClaims = await prisma.donationClaim.count({
      where: {
        donationId,
        status: { in: ['reserved', 'confirmed'] },
      },
    });

    if (activeClaims > 0) {
      return NextResponse.json(
        { error: 'Donation has an active claim and cannot be cancelled' },
        { status: 409 },
      );
    }

    const previousStatus = donation.status;

    const updated = await prisma.$transaction(async (tx) => {
      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });

      const result = await tx.donation.update({
        where: { id: donationId },
        data: { status: 'cancelled' },
      });

      await tx.statusEvent.create({
        data: {
          donationId,
          actorUserId: user.id,
          fromStatus: previousStatus,
          toStatus: 'cancelled',
          reason: 'Cancelled by donor',
          eventType: 'donation_cancelled',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'donation',
          recordId: donationId,
        },
      });

      return result;
    });

    return NextResponse.json({ donation: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}