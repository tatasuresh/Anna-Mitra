import { NextResponse } from 'next/server';
import { Prisma, ClaimStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type TxResult =
  | { kind: 'ok'; claim: Prisma.DonationClaimGetPayload<object> }
  | { kind: 'bad'; status: number; message: string }
  | { kind: 'notFound' };

const HOLDING_STATUSES: string[] = [ClaimStatus.reserved, ClaimStatus.confirmed];
const RETURNING_STATUSES: string[] = [ClaimStatus.released, ClaimStatus.expired];

function isWholeNumber(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min;
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const claimId = params.claimId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  const allowedKeys = ['status', 'portionsClaimed', 'portionsReceived', 'portionsReleased', 'receivedAt'];
  const provided = allowedKeys.filter((k) => input[k] !== undefined);
  if (provided.length === 0) {
    return NextResponse.json({ error: 'No changes supplied' }, { status: 400 });
  }

  if (input.status !== undefined && !Object.values(ClaimStatus).includes(input.status as ClaimStatus)) {
    return NextResponse.json({ error: 'Invalid claim status' }, { status: 400 });
  }
  if (input.portionsClaimed !== undefined && !isWholeNumber(input.portionsClaimed, 1)) {
    return NextResponse.json({ error: 'portionsClaimed must be a whole number of at least 1' }, { status: 400 });
  }
  if (
    input.portionsReceived !== undefined &&
    input.portionsReceived !== null &&
    !isWholeNumber(input.portionsReceived, 0)
  ) {
    return NextResponse.json({ error: 'portionsReceived must be a whole number of 0 or more' }, { status: 400 });
  }
  if (input.portionsReleased !== undefined && !isWholeNumber(input.portionsReleased, 0)) {
    return NextResponse.json({ error: 'portionsReleased must be a whole number of 0 or more' }, { status: 400 });
  }
  let receivedAt: Date | null | undefined;
  if (input.receivedAt !== undefined) {
    if (input.receivedAt === null) {
      receivedAt = null;
    } else {
      const parsed = new Date(String(input.receivedAt));
      if (typeof input.receivedAt !== 'string' || Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'receivedAt must be a valid date' }, { status: 400 });
      }
      receivedAt = parsed;
    }
  }

  try {
    const result: TxResult = await prisma.$transaction(async (tx): Promise<TxResult> => {
      const claim = await tx.donationClaim.findUnique({ where: { id: claimId } });
      if (!claim) return { kind: 'notFound' };

      const donation = await tx.donation.findUnique({ where: { id: claim.donationId } });
      if (!donation) return { kind: 'notFound' };

      const nextStatus = (input.status as ClaimStatus | undefined) ?? claim.status;
      const nextClaimed = (input.portionsClaimed as number | undefined) ?? claim.portionsClaimed;
      const nextReceived =
        input.portionsReceived !== undefined
          ? (input.portionsReceived as number | null)
          : claim.portionsReceived;

      if (nextReceived !== null && nextReceived !== undefined && nextReceived > nextClaimed) {
        return { kind: 'bad', status: 400, message: 'portionsReceived cannot exceed portionsClaimed' };
      }

      // Keep the donation's remaining portions consistent with the claim's holding state.
      const oldHold = HOLDING_STATUSES.includes(claim.status) ? claim.portionsClaimed : 0;
      const newHold = HOLDING_STATUSES.includes(nextStatus) ? nextClaimed : 0;
      const delta = oldHold - newHold;

      if (delta !== 0) {
        const newRemaining = donation.portionsRemaining + delta;
        if (newRemaining < 0) {
          return {
            kind: 'bad',
            status: 409,
            message: 'Change would exceed the portions available on the donation',
          };
        }
        await tx.donation.update({
          where: { id: donation.id },
          data: { portionsRemaining: newRemaining },
        });
      }

      const data: Prisma.DonationClaimUpdateInput = {};
      if (input.status !== undefined) data.status = nextStatus;
      if (input.portionsClaimed !== undefined) data.portionsClaimed = nextClaimed;
      if (input.portionsReceived !== undefined) data.portionsReceived = nextReceived;
      if (input.portionsReleased !== undefined) {
        data.portionsReleased = input.portionsReleased as number;
      } else if (
        input.status !== undefined &&
        RETURNING_STATUSES.includes(nextStatus) &&
        !RETURNING_STATUSES.includes(claim.status)
      ) {
        data.portionsReleased = nextClaimed;
      }
      if (receivedAt !== undefined) data.receivedAt = receivedAt;

      const updated = await tx.donationClaim.update({ where: { id: claim.id }, data });
      return { kind: 'ok', claim: updated };
    });

    if (result.kind === 'notFound') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (result.kind === 'bad') {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    return NextResponse.json({ claim: result.claim });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}