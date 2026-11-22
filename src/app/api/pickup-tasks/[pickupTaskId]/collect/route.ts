import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const task = await prisma.pickupTask.findUnique({
      where: { id: params.pickupTaskId },
    });

    // Another volunteer's task is reported as not found (own_only rule).
    if (!task || task.volunteerUserId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (task.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Pickup can only be collected from accepted status' },
        { status: 409 }
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { id: task.donationId },
      select: { id: true, status: true },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const now = new Date();

    const collected = await prisma.$transaction(async (tx) => {
      // Guard against concurrent transitions: only moves from accepted.
      const moved = await tx.pickupTask.updateMany({
        where: {
          id: task.id,
          volunteerUserId: user.id,
          status: 'accepted',
        },
        data: {
          status: 'collected',
          collectedAt: now,
        },
      });

      if (moved.count === 0) {
        return null;
      }

      await tx.donation.update({
        where: { id: donation.id },
        data: { status: 'in_transit' },
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
          toStatus: 'in_transit',
          reason: 'Volunteer collected the food',
          eventType: 'pickup_collected',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'PickupTask',
          recordId: task.id,
        },
      });

      return tx.pickupTask.findUnique({ where: { id: task.id } });
    });

    if (!collected) {
      return NextResponse.json(
        { error: 'Pickup can only be collected from accepted status' },
        { status: 409 }
      );
    }

    return NextResponse.json({ pickupTask: collected });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}