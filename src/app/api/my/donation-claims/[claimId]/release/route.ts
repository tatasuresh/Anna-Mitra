import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const LIVE_CLAIM_STATUSES = ['reserved', 'confirmed'] as const;

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'ngo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { claimId } = await params;

  try {
    const caller = await prisma.user.findUnique({
      where: { id: user.id },
      select: { ngoId: true },
    });

    if (!caller?.ngoId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const claim = await prisma.donationClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim || claim.ngoId !== caller.ngoId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (claim.status !== 'reserved') {
      return NextResponse.json(
        { error: 'Only a reserved claim can be released' },
        { status: 409 },
      );
    }

    const released = await prisma.$transaction(async (tx) => {
      // Conditional update guards against a concurrent confirm/release/expiry.
      const transition = await tx.donationClaim.updateMany({
        where: { id: claim.id, status: 'reserved' },
        data: {
          status: 'released',
          portionsReleased: claim.portionsClaimed,
        },
      });

      if (transition.count === 0) {
        return null;
      }

      const updatedClaim = await tx.donationClaim.findUniqueOrThrow({
        where: { id: claim.id },
      });

      const donation = await tx.donation.findUniqueOrThrow({
        where: { id: claim.donationId },
      });

      const liveClaims = await tx.donationClaim.count({
        where: {
          donationId: claim.donationId,
          status: { in: [...LIVE_CLAIM_STATUSES] },
        },
      });

      const previousStatus = donation.status as string;
      const reopenable =
        previousStatus === 'claimed' || previousStatus === 'partially_claimed';
      const nextStatus =
        liveClaims > 0 ? 'partially_claimed' : 'published';

      await tx.donation.update({
        where: { id: claim.donationId },
        data: reopenable
          ? {
              portionsRemaining: { increment: claim.portionsClaimed },
              status: nextStatus,
            }
          : {
              portionsRemaining: { increment: claim.portionsClaimed },
            },
      });

      await tx.pickupTask.updateMany({
        where: { claimId: claim.id, status: 'open' },
        data: {
          status: 'failed',
          failureReason: 'Claim released by NGO',
        },
      });

      const sequence = await tx.statusEvent.aggregate({
        where: { donationId: claim.donationId },
        _max: { sequenceNo: true },
      });

      await tx.statusEvent.create({
        data: {
          donationId: claim.donationId,
          pickupTaskId: null,
          actorUserId: user.id,
          fromStatus: previousStatus,
          toStatus: reopenable ? nextStatus : previousStatus,
          reason: 'Claim released by NGO before handover',
          eventType: 'claim_released',
          sequenceNo: (sequence._max.sequenceNo ?? 0) + 1,
          recordType: 'donation_claim',
          recordId: claim.id,
        },
      });

      return updatedClaim;
    });

    if (!released) {
      return NextResponse.json(
        { error: 'Only a reserved claim can be released' },
        { status: 409 },
      );
    }

    return NextResponse.json({ claim: released });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}