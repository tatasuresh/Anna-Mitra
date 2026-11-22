import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ClaimStatus, DonationStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const RESOLVABLE_STATUSES: DonationStatus[] = [
  'claimed',
  'partially_claimed',
  'in_transit',
  'failed',
];

const LIVE_CLAIM_STATUSES: ClaimStatus[] = ['reserved', 'confirmed'];

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
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

  const { action, reason } = (body ?? {}) as { action?: unknown; reason?: unknown };

  if (action !== 'reopen' && action !== 'close') {
    return NextResponse.json(
      { error: "Action must be 'reopen' or 'close'." },
      { status: 400 },
    );
  }

  if (typeof reason !== 'string') {
    return NextResponse.json(
      { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
      { status: 400 },
    );
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5 || trimmedReason.length > 300) {
    return NextResponse.json(
      { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
      { status: 400 },
    );
  }

  const donationId = params.donationId;

  try {
    const existing = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!RESOLVABLE_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: 'This donation has no failed assignment to resolve.' },
        { status: 409 },
      );
    }

    const donation = await prisma.$transaction(async (tx) => {
      let nextStatus: DonationStatus;
      let portionsRemaining = existing.portionsRemaining;

      if (action === 'reopen') {
        const live = await tx.donationClaim.aggregate({
          where: {
            donationId,
            status: { in: LIVE_CLAIM_STATUSES },
          },
          _sum: { portionsClaimed: true },
        });
        const committed = live._sum.portionsClaimed ?? 0;
        portionsRemaining = Math.max(0, existing.portionsTotal - committed);
        nextStatus = 'published';
      } else {
        nextStatus = 'cancelled';
      }

      const updated = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: nextStatus,
          portionsRemaining,
        },
      });

      const last = await tx.statusEvent.aggregate({
        where: { donationId },
        _max: { sequenceNo: true },
      });

      await tx.statusEvent.create({
        data: {
          donationId,
          actorUserId: user.id,
          fromStatus: existing.status,
          toStatus: nextStatus,
          reason: trimmedReason,
          eventType: action === 'reopen' ? 'failure_reopened' : 'failure_closed',
          sequenceNo: (last._max.sequenceNo ?? 0) + 1,
        },
      });

      return updated;
    });

    return NextResponse.json({ donation });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}