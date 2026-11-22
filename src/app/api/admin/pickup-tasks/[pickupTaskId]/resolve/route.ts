import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

type ResolveResult =
  | { kind: 'notFound' }
  | { kind: 'conflict'; error: string }
  | { kind: 'ok'; pickupTask: Awaited<ReturnType<typeof loadTaskShape>> };

// Type helper only: describes the shape returned by the update below.
async function loadTaskShape() {
  return prisma.pickupTask.findFirstOrThrow({ where: { id: '' } });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fields =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const resolution = fields.resolution;
  const reasonRaw = fields.reason;

  if (resolution !== 'reassign' && resolution !== 'close') {
    return NextResponse.json(
      { error: 'Choose whether to reassign or close the failed pickup.' },
      { status: 400 }
    );
  }

  const reason = typeof reasonRaw === 'string' ? reasonRaw.trim() : '';
  if (reason.length < 5 || reason.length > 300) {
    return NextResponse.json(
      { error: 'Enter a short reason of 5 to 300 characters for this resolution.' },
      { status: 400 }
    );
  }

  const pickupTaskId = params.pickupTaskId;

  try {
    const result: ResolveResult = await prisma.$transaction(async (tx) => {
      const task = await tx.pickupTask.findUnique({ where: { id: pickupTaskId } });
      if (!task) {
        return { kind: 'notFound' } as ResolveResult;
      }

      if (task.status !== 'failed') {
        return {
          kind: 'conflict',
          error: 'Only failed pickups can be resolved.',
        } as ResolveResult;
      }

      if (resolution === 'reassign') {
        const claim = await tx.donationClaim.findUnique({
          where: { id: task.claimId },
        });
        if (claim && (claim.status === 'expired' || claim.status === 'released')) {
          return {
            kind: 'conflict',
            error: 'The linked claim has expired, so this pickup cannot be reassigned.',
          } as ResolveResult;
        }
      }

      const toStatus = resolution === 'reassign' ? 'open' : 'failed';

      const updated = await tx.pickupTask.update({
        where: { id: task.id },
        data:
          resolution === 'reassign'
            ? {
                status: 'open',
                volunteerUserId: null,
                acceptedAt: null,
                collectedAt: null,
                handedOverAt: null,
              }
            : { status: 'failed' },
      });

      const aggregate = await tx.statusEvent.aggregate({
        where: { donationId: task.donationId },
        _max: { sequenceNo: true },
      });
      const sequenceNo = (aggregate._max.sequenceNo ?? 0) + 1;

      await tx.statusEvent.create({
        data: {
          donationId: task.donationId,
          pickupTaskId: task.id,
          actorUserId: user.id,
          fromStatus: 'failed',
          toStatus,
          reason,
          eventType: 'pickup_resolution',
          sequenceNo,
          recordType: 'pickup_task',
          recordId: task.id,
        },
      });

      return { kind: 'ok', pickupTask: updated } as ResolveResult;
    });

    if (result.kind === 'notFound') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (result.kind === 'conflict') {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ pickupTask: result.pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}