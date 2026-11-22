import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const FAILABLE_STATUSES: string[] = ['accepted', 'collected'];

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawReason =
    body && typeof body === 'object' && 'reason' in body
      ? (body as { reason: unknown }).reason
      : undefined;

  if (typeof rawReason !== 'string' || rawReason.trim().length === 0) {
    return NextResponse.json(
      { error: 'A reason is required to report a failed pickup.' },
      { status: 400 }
    );
  }
  const reason = rawReason.trim();

  const pickupTaskId = params.pickupTaskId;

  try {
    const pickupTask = await prisma.$transaction(async (tx) => {
      const task = await tx.pickupTask.findUnique({ where: { id: pickupTaskId } });

      if (!task || task.volunteerUserId !== user.id) {
        throw new HttpError(404, 'Not found');
      }

      if (!FAILABLE_STATUSES.includes(task.status)) {
        throw new HttpError(
          409,
          'This pickup can only be reported as failed while it is accepted or collected.'
        );
      }

      const fromStatus = task.status;

      const updated = await tx.pickupTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          failureReason: reason,
        },
      });

      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId: task.donationId },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });
      const sequenceNo = (lastEvent?.sequenceNo ?? 0) + 1;

      await tx.statusEvent.create({
        data: {
          donationId: task.donationId,
          pickupTaskId: task.id,
          actorUserId: user.id,
          fromStatus,
          toStatus: 'failed',
          reason,
          eventType: 'pickup_failed',
          sequenceNo,
          recordType: 'PickupTask',
          recordId: task.id,
        },
      });

      return updated;
    });

    return NextResponse.json({ pickupTask });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}