import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

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

  const pickupTaskId = params.pickupTaskId;

  try {
    const task = await prisma.pickupTask.findFirst({
      where: { id: pickupTaskId, volunteerUserId: user.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (task.status !== 'collected') {
      return NextResponse.json(
        { error: 'Pickup must be collected before it can be handed over' },
        { status: 409 }
      );
    }

    // Notifying the NGO to confirm the received quantity is driven by the
    // handed_over status change; no Notification model exists in the schema.
    const handedOver = await prisma.$transaction(async (tx) => {
      const last = await tx.statusEvent.aggregate({
        where: { donationId: task.donationId },
        _max: { sequenceNo: true },
      });

      const updated = await tx.pickupTask.updateMany({
        where: {
          id: task.id,
          volunteerUserId: user.id,
          status: 'collected',
        },
        data: {
          status: 'handed_over',
          handedOverAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return null;
      }

      await tx.statusEvent.create({
        data: {
          donationId: task.donationId,
          pickupTaskId: task.id,
          actorUserId: user.id,
          fromStatus: 'collected',
          toStatus: 'handed_over',
          eventType: 'pickup_handed_over',
          sequenceNo: (last._max.sequenceNo ?? 0) + 1,
          recordType: 'pickup_task',
          recordId: task.id,
        },
      });

      return tx.pickupTask.findUnique({ where: { id: task.id } });
    });

    if (!handedOver) {
      return NextResponse.json(
        { error: 'Pickup must be collected before it can be handed over' },
        { status: 409 }
      );
    }

    return NextResponse.json({ pickupTask: handedOver });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}