import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const MAX_REASON_LENGTH = 500;
const FAILABLE_STATUSES = ['accepted', 'collected'] as const;

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const candidate = raw.failure_reason ?? raw.reason;

  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    return NextResponse.json(
      { error: 'failure_reason is required' },
      { status: 400 },
    );
  }

  const failureReason = candidate.trim();
  if (failureReason.length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      { error: `failure_reason must be ${MAX_REASON_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const pickupTaskId = params.pickupTaskId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.pickupTask.findFirst({
        where: { id: pickupTaskId, volunteerUserId: user.id },
      });

      if (!existing) {
        return { kind: 'not_found' as const };
      }

      if (!FAILABLE_STATUSES.includes(existing.status as (typeof FAILABLE_STATUSES)[number])) {
        return { kind: 'conflict' as const };
      }

      const fromStatus = existing.status;

      const moved = await tx.pickupTask.updateMany({
        where: {
          id: pickupTaskId,
          volunteerUserId: user.id,
          status: { in: [...FAILABLE_STATUSES] },
        },
        data: {
          status: 'failed',
          failureReason,
        },
      });

      if (moved.count === 0) {
        return { kind: 'conflict' as const };
      }

      const updated = await tx.pickupTask.findUnique({
        where: { id: pickupTaskId },
      });

      if (!updated) {
        return { kind: 'not_found' as const };
      }

      const eventCount = await tx.statusEvent.count({
        where: { donationId: existing.donationId },
      });

      await tx.statusEvent.create({
        data: {
          donationId: existing.donationId,
          pickupTaskId,
          actorUserId: user.id,
          fromStatus,
          toStatus: 'failed',
          reason: failureReason,
          eventType: 'pickup_failed',
          sequenceNo: eventCount + 1,
          recordType: 'PickupTask',
          recordId: pickupTaskId,
        },
      });

      return { kind: 'ok' as const, pickupTask: updated };
    });

    if (result.kind === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (result.kind === 'conflict') {
      return NextResponse.json(
        { error: 'Pickup can only be reported failed while accepted or collected' },
        { status: 409 },
      );
    }

    return NextResponse.json({ pickupTask: result.pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}