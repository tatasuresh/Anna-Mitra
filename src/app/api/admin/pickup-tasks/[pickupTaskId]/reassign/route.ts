import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RouteError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

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

  const taskId = params.pickupTaskId;
  if (!UUID_PATTERN.test(taskId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let reason = 'Reassigned by admin';
  const raw = await request.text().catch(() => '');
  if (raw.trim()) {
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (body && typeof body === 'object' && 'reason' in body) {
      const given = (body as { reason: unknown }).reason;
      if (typeof given !== 'string') {
        return NextResponse.json(
          { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
          { status: 400 }
        );
      }
      const trimmed = given.trim();
      if (trimmed.length < 5 || trimmed.length > 300) {
        return NextResponse.json(
          { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
          { status: 400 }
        );
      }
      reason = trimmed;
    }
  }

  try {
    const pickupTask = await prisma.$transaction(async (tx) => {
      const current = await tx.pickupTask.findUnique({ where: { id: taskId } });
      if (!current) {
        throw new RouteError(404, 'Not found');
      }

      if (current.status !== 'failed') {
        throw new RouteError(409, 'Only failed pickups can be reassigned');
      }

      const claim = await tx.donationClaim.findUnique({
        where: { id: current.claimId },
      });
      if (!claim) {
        throw new RouteError(409, 'The linked claim could not be found');
      }
      if (claim.status === 'expired') {
        throw new RouteError(409, 'The linked claim has expired and cannot be reassigned');
      }

      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId: current.donationId },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });

      const updated = await tx.pickupTask.update({
        where: { id: taskId },
        data: {
          status: 'open',
          volunteerUserId: null,
          acceptedAt: null,
          collectedAt: null,
          handedOverAt: null,
        },
      });

      await tx.statusEvent.create({
        data: {
          donationId: current.donationId,
          pickupTaskId: taskId,
          actorUserId: user.id,
          fromStatus: 'failed',
          toStatus: 'open',
          reason,
          eventType: 'pickup_reassigned',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'pickup_task',
          recordId: taskId,
        },
      });

      return updated;
    });

    return NextResponse.json({ pickupTask });
  } catch (e) {
    if (e instanceof RouteError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}