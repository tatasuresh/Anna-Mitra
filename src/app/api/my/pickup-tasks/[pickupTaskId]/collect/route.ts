import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type CollectOutcome =
  | { ok: true; pickupTask: unknown }
  | { ok: false; status: 409; error: string };

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pickupTaskId = params.pickupTaskId;

  try {
    const existing = await prisma.pickupTask.findFirst({
      where: { id: pickupTaskId, volunteerUserId: user.id },
      select: { id: true, donationId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Pickup can only be collected from accepted status' },
        { status: 409 },
      );
    }

    const outcome: CollectOutcome = await prisma.$transaction(async (tx) => {
      const moved = await tx.pickupTask.updateMany({
        where: { id: existing.id, volunteerUserId: user.id, status: 'accepted' },
        data: { status: 'collected', collectedAt: new Date() },
      });

      if (moved.count === 0) {
        return {
          ok: false,
          status: 409,
          error: 'Pickup is no longer in accepted status',
        };
      }

      const donation = await tx.donation.findUnique({
        where: { id: existing.donationId },
        select: { status: true },
      });

      await tx.donation.update({
        where: { id: existing.donationId },
        data: { status: 'in_transit' },
      });

      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId: existing.donationId },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });

      await tx.statusEvent.create({
        data: {
          donationId: existing.donationId,
          pickupTaskId: existing.id,
          actorUserId: user.id,
          fromStatus: donation?.status ?? null,
          toStatus: 'in_transit',
          reason: 'Pickup collected by volunteer',
          eventType: 'pickup_collected',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'pickup_task',
          recordId: existing.id,
        },
      });

      const pickupTask = await tx.pickupTask.findUnique({
        where: { id: existing.id },
      });

      return { ok: true, pickupTask };
    });

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    return NextResponse.json({ pickupTask: outcome.pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}