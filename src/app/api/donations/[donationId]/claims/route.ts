import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const DEFAULT_RESERVATION_MINUTES = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAIM_READER_ROLES = ['volunteer', 'ngo'];

class ClaimConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaimConflictError';
  }
}

function reservationMinutes(): number {
  const raw = Number(process.env.RESERVATION_TIMEOUT_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RESERVATION_MINUTES;
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (!CLAIM_READER_ROLES.includes(user.role as string)) {
    return NextResponse.json(
      { error: 'Only volunteer or NGO accounts can view donation claims' },
      { status: 403 }
    );
  }

  const donationId = params.donationId;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const claims = await prisma.donationClaim.findMany({
      where: { donationId },
    });

    return NextResponse.json({ claims });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'ngo') {
    return NextResponse.json(
      { error: 'Only NGO accounts can claim donations' },
      { status: 403 }
    );
  }

  const donationId = params.donationId;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawPortions =
    typeof body === 'object' && body !== null
      ? (body as { portions_claimed?: unknown }).portions_claimed
      : undefined;

  if (rawPortions === undefined || rawPortions === null || rawPortions === '') {
    return NextResponse.json(
      { error: 'Enter how many portions you want to claim.' },
      { status: 400 }
    );
  }

  const portionsClaimed = Number(rawPortions);

  const callerProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { ngoId: true },
  });
  const ngoId = callerProfile?.ngoId ?? null;
  if (!ngoId) {
    return NextResponse.json(
      { error: 'Your account is not linked to an NGO' },
      { status: 403 }
    );
  }

  try {
    const capacity = await prisma.ngoCapacity.findFirst({
      where: { ngoId },
    });

    if (capacity && !capacity.isAvailable) {
      return NextResponse.json(
        { error: 'Your NGO is not currently available to claim' },
        { status: 403 }
      );
    }

    const maxPerClaim = capacity?.maxPortionsPerClaim ?? null;

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const upperBound =
      maxPerClaim !== null
        ? Math.min(donation.portionsRemaining, maxPerClaim)
        : donation.portionsRemaining;

    const maxLabel = maxPerClaim !== null ? String(maxPerClaim) : 'no limit';
    const rangeError = `Enter a whole number between 1 and the portions still available for this donation (maximum per claim for your NGO: ${maxLabel}).`;

    if (!Number.isInteger(portionsClaimed) || portionsClaimed < 1) {
      return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    if (portionsClaimed > upperBound) {
      return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    const now = new Date();

    if (donation.pickupByAt.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'The pickup-by time for this donation has passed' },
        { status: 409 }
      );
    }

    const reservedUntil = new Date(
      now.getTime() + reservationMinutes() * 60 * 1000
    );

    const claim = await prisma.$transaction(async (tx) => {
      // Conditional decrement: succeeds only if enough portions remain and
      // the donation is still claimable. This prevents over-allocation under
      // concurrent claims because the row is locked for the update.
      const reserved = await tx.donation.updateMany({
        where: {
          id: donationId,
          status: { in: ['published', 'partially_claimed'] },
          pickupByAt: { gt: now },
          portionsRemaining: { gte: portionsClaimed },
        },
        data: {
          portionsRemaining: { decrement: portionsClaimed },
        },
      });

      if (reserved.count === 0) {
        throw new ClaimConflictError(
          'These portions are no longer available for this donation'
        );
      }

      const updated = await tx.donation.findUnique({
        where: { id: donationId },
      });
      if (!updated) {
        throw new ClaimConflictError('This donation is no longer available');
      }

      const previousStatus = donation.status;
      const nextStatus = updated.portionsRemaining === 0 ? 'claimed' : 'partially_claimed';

      await tx.donation.update({
        where: { id: donationId },
        data: { status: nextStatus },
      });

      const newClaim = await tx.donationClaim.create({
        data: {
          donationId,
          ngoId,
          claimedByUserId: user.id,
          portionsClaimed,
          reservedUntil,
          status: 'reserved',
          portionsReleased: 0,
        },
      });

      await tx.pickupTask.create({
        data: {
          donationId,
          claimId: newClaim.id,
          portionCount: portionsClaimed,
          status: 'open',
        },
      });

      const sequenceNo =
        (await tx.statusEvent.count({ where: { donationId } })) + 1;

      await tx.statusEvent.create({
        data: {
          donationId,
          actorUserId: user.id,
          fromStatus: previousStatus,
          toStatus: nextStatus,
          eventType: 'claim_reserved',
          reason: `${portionsClaimed} portion(s) reserved by NGO`,
          sequenceNo,
          recordType: 'donation_claim',
          recordId: newClaim.id,
        },
      });

      return newClaim;
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (e) {
    if (e instanceof ClaimConflictError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}