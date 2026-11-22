import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const LIVE_CLAIM_STATUSES = ['reserved', 'confirmed'] as const;
const REOPENABLE_DONATION_STATUSES = ['claimed', 'partially_claimed', 'in_transit'] as const;

type CancelOutcome =
  | { kind: 'not_found' }
  | { kind: 'conflict'; message: string }
  | { kind: 'ok'; pickupTask: Awaited<ReturnType<typeof prisma.pickupTask.update>> };

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const reason =
    typeof body === 'object' && body !== null && 'reason' in body
      ? (body as { reason: unknown }).reason
      : undefined;

  if (typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 300) {
    return NextResponse.json(
      { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
      { status: 400 }
    );
  }

  const cleanReason = reason.trim();
  const pickupTaskId = params.pickupTaskId;

  try {
    const outcome: CancelOutcome = await prisma.$transaction(async (tx) => {
      const task = await tx.pickupTask.findUnique({ where: { id: pickupTaskId } });
      if (!task) {
        return { kind: 'not_found' };
      }

      if (task.status === 'handed_over') {
        return {
          kind: 'conflict',
          message: 'A pickup that has already been handed over cannot be cancelled.',
        };
      }

      const donation = await tx.donation.findUnique({ where: { id: task.donationId } });
      if (!donation) {
        return { kind: 'not_found' };
      }

      // The schema has no "cancelled" pickup status, so the task is closed as failed
      // with the admin's reason recorded, and no volunteer can pick it up again.
      const pickupTask = await tx.pickupTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          failureReason: `Cancelled by admin: ${cleanReason}`,
        },
      });

      let portionsRemaining = donation.portionsRemaining;

      const claim = await tx.donationClaim.findUnique({ where: { id: task.claimId } });
      if (claim && (LIVE_CLAIM_STATUSES as readonly string[]).includes(claim.status)) {
        await tx.donationClaim.update({
          where: { id: claim.id },
          data: {
            status: 'released',
            portionsReleased: claim.portionsClaimed,
          },
        });
        portionsRemaining = donation.portionsRemaining + claim.portionsClaimed;
      }

      const liveClaimCount = await tx.donationClaim.count({
        where: {
          donationId: donation.id,
          status: { in: [...LIVE_CLAIM_STATUSES] },
        },
      });

      const shouldReopen =
        liveClaimCount === 0 &&
        (REOPENABLE_DONATION_STATUSES as readonly string[]).includes(donation.status);

      const nextDonationStatus = shouldReopen ? 'published' : donation.status;

      await tx.donation.update({
        where: { id: donation.id },
        data: {
          portionsRemaining,
          status: nextDonationStatus,
        },
      });

      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId: donation.id },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });

      await tx.statusEvent.create({
        data: {
          donationId: donation.id,
          pickupTaskId: task.id,
          actorUserId: user.id,
          fromStatus: donation.status,
          toStatus: nextDonationStatus,
          reason: `Pickup task cancelled by admin: ${cleanReason}`,
          eventType: 'pickup_task_cancelled',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'pickup_task',
          recordId: task.id,
        },
      });

      return { kind: 'ok', pickupTask };
    });

    if (outcome.kind === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (outcome.kind === 'conflict') {
      return NextResponse.json({ error: outcome.message }, { status: 409 });
    }

    return NextResponse.json({ pickupTask: outcome.pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}