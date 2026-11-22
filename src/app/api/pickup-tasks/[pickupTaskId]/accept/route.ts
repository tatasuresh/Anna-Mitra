import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type AcceptOutcome =
  | { ok: true; pickupTask: unknown }
  | { ok: false; status: number; error: string };

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const pickupTaskId = params.pickupTaskId;

  try {
    const volunteer = await prisma.user.findUnique({ where: { id: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (volunteer.role !== 'volunteer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (volunteer.status !== 'approved') {
      return NextResponse.json({ error: 'Your account is not approved' }, { status: 403 });
    }
    if (!volunteer.isAvailable) {
      return NextResponse.json(
        { error: 'Turn availability on before accepting a pickup' },
        { status: 409 },
      );
    }
    if (volunteer.carryingCapacity === null || volunteer.carryingCapacity === undefined) {
      return NextResponse.json(
        { error: 'Enter how many portions you can carry before going available.' },
        { status: 409 },
      );
    }

    const carryingCapacity = volunteer.carryingCapacity;

    const result = await prisma.$transaction<AcceptOutcome>(
      async (tx) => {
        const task = await tx.pickupTask.findUnique({ where: { id: pickupTaskId } });
        if (!task) {
          return { ok: false, status: 404, error: 'Pickup task not found' };
        }
        if (task.status !== 'open' || task.volunteerUserId !== null) {
          return { ok: false, status: 409, error: 'This pickup has already been accepted' };
        }

        const [donation, claim] = await Promise.all([
          tx.donation.findUnique({ where: { id: task.donationId } }),
          tx.donationClaim.findUnique({ where: { id: task.claimId } }),
        ]);

        if (!donation) {
          return { ok: false, status: 404, error: 'Donation not found' };
        }
        if (donation.pickupByAt.getTime() <= Date.now()) {
          return { ok: false, status: 409, error: 'The pickup-by time has passed' };
        }
        if (!claim || claim.status !== 'confirmed') {
          return { ok: false, status: 409, error: 'The linked claim is not confirmed' };
        }
        if (task.portionCount > carryingCapacity) {
          return {
            ok: false,
            status: 409,
            error: 'This pickup is larger than your carrying capacity',
          };
        }

        const { count } = await tx.pickupTask.updateMany({
          where: { id: task.id, status: 'open', volunteerUserId: null },
          data: {
            status: 'accepted',
            volunteerUserId: volunteer.id,
            acceptedAt: new Date(),
          },
        });
        if (count === 0) {
          return { ok: false, status: 409, error: 'This pickup has already been accepted' };
        }

        const updated = await tx.pickupTask.findUniqueOrThrow({ where: { id: task.id } });

        const last = await tx.statusEvent.aggregate({
          where: { donationId: task.donationId },
          _max: { sequenceNo: true },
        });

        await tx.statusEvent.create({
          data: {
            donationId: task.donationId,
            pickupTaskId: task.id,
            actorUserId: volunteer.id,
            fromStatus: 'open',
            toStatus: 'accepted',
            reason: null,
            eventType: 'pickup_accepted',
            sequenceNo: (last._max.sequenceNo ?? 0) + 1,
            recordType: 'PickupTask',
            recordId: task.id,
          },
        });

        return { ok: true, pickupTask: updated };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ pickupTask: result.pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}