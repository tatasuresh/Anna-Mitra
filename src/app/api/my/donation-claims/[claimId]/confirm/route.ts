import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

async function nextSequenceNo(tx: Prisma.TransactionClient, donationId: string): Promise<number> {
  const last = await tx.statusEvent.findFirst({
    where: { donationId },
    orderBy: { sequenceNo: 'desc' },
    select: { sequenceNo: true },
  });
  return (last?.sequenceNo ?? 0) + 1;
}

async function expireClaim(
  claimId: string,
  donationId: string,
  portions: number,
  actorUserId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const released = await tx.donationClaim.updateMany({
      where: { id: claimId, status: 'reserved' },
      data: { status: 'expired', portionsReleased: portions },
    });
    if (released.count === 0) return;

    const donation = await tx.donation.findUniqueOrThrow({
      where: { id: donationId },
      select: { status: true },
    });

    const liveOthers = await tx.donationClaim.count({
      where: {
        donationId,
        id: { not: claimId },
        status: { in: ['reserved', 'confirmed'] },
      },
    });
    const toStatus: 'partially_claimed' | 'published' =
      liveOthers > 0 ? 'partially_claimed' : 'published';

    await tx.donation.update({
      where: { id: donationId },
      data: {
        portionsRemaining: { increment: portions },
        status: toStatus,
      },
    });

    await tx.statusEvent.create({
      data: {
        donationId,
        actorUserId,
        fromStatus: donation.status,
        toStatus,
        reason: 'Claim reservation window expired before confirmation',
        eventType: 'claim_expired',
        sequenceNo: await nextSequenceNo(tx, donationId),
        recordType: 'DonationClaim',
        recordId: claimId,
      },
    });
  });
}

async function confirmClaim(
  claimId: string,
  donationId: string,
  portions: number,
  actorUserId: string,
  now: Date,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.donationClaim.updateMany({
      where: { id: claimId, status: 'reserved', reservedUntil: { gt: now } },
      data: { status: 'confirmed' },
    });
    if (updated.count === 0) return null;

    const donation = await tx.donation.findUniqueOrThrow({
      where: { id: donationId },
      select: { status: true, portionsRemaining: true },
    });

    const toStatus: 'claimed' | 'partially_claimed' =
      donation.portionsRemaining === 0 ? 'claimed' : 'partially_claimed';

    await tx.donation.update({
      where: { id: donationId },
      data: { status: toStatus },
    });

    await tx.statusEvent.create({
      data: {
        donationId,
        actorUserId,
        fromStatus: donation.status,
        toStatus,
        reason: `NGO confirmed claim of ${portions} portions`,
        eventType: 'claim_confirmed',
        sequenceNo: await nextSequenceNo(tx, donationId),
        recordType: 'DonationClaim',
        recordId: claimId,
      },
    });

    return tx.donationClaim.findUnique({ where: { id: claimId } });
  });
}

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

  const { claimId } = params;

  try {
    const claim = await prisma.donationClaim.findFirst({
      where: { id: claimId, claimedByUserId: user.id },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (claim.status !== 'reserved') {
      return NextResponse.json(
        { error: 'Claim is not awaiting confirmation' },
        { status: 409 },
      );
    }

    const now = new Date();

    if (claim.reservedUntil <= now) {
      await expireClaim(claim.id, claim.donationId, claim.portionsClaimed, user.id);
      return NextResponse.json(
        {
          error:
            'The reservation window has passed; the portions have been returned to the donation',
        },
        { status: 409 },
      );
    }

    const confirmed = await confirmClaim(
      claim.id,
      claim.donationId,
      claim.portionsClaimed,
      user.id,
      now,
    );

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Claim is no longer awaiting confirmation' },
        { status: 409 },
      );
    }

    return NextResponse.json({ claim: confirmed });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}