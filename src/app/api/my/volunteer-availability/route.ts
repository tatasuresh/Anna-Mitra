import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const CAPACITY_REQUIRED_ERROR = 'Enter how many portions you can carry before going available.';
const CAPACITY_RANGE_ERROR = 'Carrying capacity must be a whole number between 1 and 100 portions.';
const CAPACITY_DIGITS_ERROR = 'Enter the number of portions as digits only, for example 12.';
const AVAILABILITY_SAVE_ERROR = 'Availability could not be saved. Please try again.';

type AvailabilityBody = {
  is_available?: unknown;
  carrying_capacity?: unknown;
};

type VolunteerRecord = {
  isAvailable: boolean;
  carryingCapacity: number | null;
};

class GuardError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'GuardError';
  }
}

function toAvailability(v: VolunteerRecord) {
  return {
    is_available: v.isAvailable,
    carrying_capacity: v.carryingCapacity ?? null,
  };
}

function parseCapacity(raw: unknown): { value: number } | { error: string } {
  const text =
    typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d+$/.test(text)) {
    return { error: CAPACITY_DIGITS_ERROR };
  }
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return { error: CAPACITY_RANGE_ERROR };
  }
  return { value };
}

// Portions on pickups this volunteer has accepted but not yet handed over
// (accepted -> collected -> handed_over). Failed pickups carry a failureReason
// and are excluded.
async function committedPortions(
  tx: Prisma.TransactionClient,
  volunteerId: string,
): Promise<number> {
  const result = await tx.pickupTask.aggregate({
    where: {
      volunteerUserId: volunteerId,
      acceptedAt: { not: null },
      handedOverAt: null,
      failureReason: null,
    },
    _sum: { portionCount: true },
  });
  return result._sum.portionCount ?? 0;
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const volunteer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isAvailable: true, carryingCapacity: true },
    });
    if (!volunteer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (volunteer.role !== 'volunteer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      availability: toAvailability({
        isAvailable: volunteer.isAvailable,
        carryingCapacity: volunteer.carryingCapacity,
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: AvailabilityBody;
  try {
    body = (await request.json()) as AvailabilityBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: AVAILABILITY_SAVE_ERROR }, { status: 400 });
  }

  const hasAvailability = body.is_available !== undefined && body.is_available !== null;
  const hasCapacity = body.carrying_capacity !== undefined && body.carrying_capacity !== null;

  if (!hasAvailability && !hasCapacity) {
    return NextResponse.json({ error: AVAILABILITY_SAVE_ERROR }, { status: 400 });
  }

  // The availability toggle must be an explicit on or off value.
  if (hasAvailability && typeof body.is_available !== 'boolean') {
    return NextResponse.json({ error: AVAILABILITY_SAVE_ERROR }, { status: 400 });
  }

  let parsedCapacity: number | undefined;
  if (hasCapacity) {
    const result = parseCapacity(body.carrying_capacity);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    parsedCapacity = result.value;
  }

  const requestedAvailable = hasAvailability ? (body.is_available as boolean) : undefined;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const volunteer = await tx.user.findUnique({
        where: { id: user.id },
        select: { role: true, status: true, isAvailable: true, carryingCapacity: true },
      });
      if (!volunteer) {
        throw new GuardError(401, 'Unauthorized');
      }
      if (volunteer.role !== 'volunteer') {
        throw new GuardError(403, 'Forbidden');
      }
      if (volunteer.status !== 'approved') {
        throw new GuardError(
          403,
          'Your account must be approved before you can change availability.',
        );
      }

      const committed = await committedPortions(tx, user.id);

      const nextAvailable = requestedAvailable ?? volunteer.isAvailable;
      const nextCapacity = parsedCapacity ?? volunteer.carryingCapacity;

      // Carrying capacity is required before a volunteer can go available.
      if (nextAvailable && (nextCapacity === null || nextCapacity === undefined)) {
        throw new GuardError(400, CAPACITY_REQUIRED_ERROR);
      }

      // Cannot switch availability off while holding an un-handed-over pickup.
      if (requestedAvailable === false && committed > 0) {
        throw new GuardError(
          409,
          'You cannot go offline while you hold a pickup you have not handed over.',
        );
      }

      // Capacity cannot drop below the portions already committed.
      if (parsedCapacity !== undefined && parsedCapacity < committed) {
        throw new GuardError(
          409,
          `Carrying capacity cannot be lower than the ${committed} portions you have already accepted.`,
        );
      }

      return tx.user.update({
        where: { id: user.id },
        data: {
          ...(requestedAvailable !== undefined ? { isAvailable: requestedAvailable } : {}),
          ...(parsedCapacity !== undefined ? { carryingCapacity: parsedCapacity } : {}),
        },
        select: { isAvailable: true, carryingCapacity: true },
      });
    });

    return NextResponse.json({ availability: toAvailability(updated) });
  } catch (e) {
    if (e instanceof GuardError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}