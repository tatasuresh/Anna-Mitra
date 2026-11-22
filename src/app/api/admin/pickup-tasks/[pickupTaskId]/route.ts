import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOCKED_FIELDS = [
  'status',
  'volunteerUserId',
  'acceptedAt',
  'collectedAt',
  'handedOverAt',
] as const;

const MAX_FAILURE_REASON_LENGTH = 500;

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { pickupTaskId } = params;
  if (!UUID_PATTERN.test(pickupTaskId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const pickupTask = await prisma.pickupTask.findUnique({
      where: { id: pickupTaskId },
    });
    if (!pickupTask) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ pickupTask });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { pickupTaskId } = params;
  if (!UUID_PATTERN.test(pickupTaskId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  const lockedUsed = LOCKED_FIELDS.filter((field) => field in input);
  if (lockedUsed.length > 0) {
    return NextResponse.json(
      {
        error: `These fields cannot be changed here: ${lockedUsed.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const data: { portionCount?: number; failureReason?: string | null } = {};

  if ('portionCount' in input) {
    const value = input.portionCount;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      return NextResponse.json(
        { error: 'Portion count must be a whole number of at least 1' },
        { status: 400 },
      );
    }
    data.portionCount = value;
  }

  if ('failureReason' in input) {
    const value = input.failureReason;
    if (value === null) {
      data.failureReason = null;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > MAX_FAILURE_REASON_LENGTH) {
        return NextResponse.json(
          {
            error: `Failure reason must be ${MAX_FAILURE_REASON_LENGTH} characters or fewer`,
          },
          { status: 400 },
        );
      }
      data.failureReason = trimmed.length > 0 ? trimmed : null;
    } else {
      return NextResponse.json(
        { error: 'Failure reason must be text or null' },
        { status: 400 },
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'No editable fields provided' },
      { status: 400 },
    );
  }

  try {
    const pickupTask = await prisma.pickupTask.update({
      where: { id: pickupTaskId },
      data,
    });
    return NextResponse.json({ pickupTask });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}