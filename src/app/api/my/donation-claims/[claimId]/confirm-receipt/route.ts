import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const caller = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (caller.role !== 'ngo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw =
    typeof body === 'object' && body !== null
      ? (body as { confirmed_portions?: unknown }).confirmed_portions
      : undefined;

  if (raw === undefined || raw === null || raw === '') {
    return NextResponse.json(
      { error: 'Enter the number of portions you received.' },
      { status: 400 },
    );
  }
  if (typeof raw !== 'number' || !Number.isInteger(raw)) {
    return NextResponse.json(
      { error: 'Enter a whole number of portions from 0 to the claimed amount.' },
      { status: 400 },
    );
  }

  try {
    const claim = await prisma.donationClaim.findUnique({
      where: { id: params.claimId },
    });
    if (!claim || claim.claimedByUserId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (raw < 0 || raw > claim.portionsClaimed) {
      return NextResponse.json(
        { error: 'Enter a whole number of portions from 0 to the claimed amount.' },
        { status: 400 },
      );
    }

    if (claim.receivedAt) {
      return NextResponse.json(
        { error: 'Receipt has already been confirmed for this claim' },
        { status: 409 },
      );
    }

    if (claim.status !== 'reserved' && claim.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'This claim cannot receive a receipt in its current state' },
        { status: 409 },
      );
    }

    const handedOverPickup = await prisma.pickupTask.findFirst({
      where: { claimId: claim.id, handedOverAt: { not: null } },
    });
    if (!handedOverPickup) {
      return NextResponse.json(
        { error: 'The pickup has not been handed over yet' },
        { status: 409 },
      );
    }

    const updatedClaim = await prisma.$transaction(async (tx) => {
      const c = await tx.donationClaim.update({
        where: { id: claim.id },
        data: {
          portionsReceived: raw,
          receivedAt: new Date(),
          status: 'confirmed',
        },
      });
      await tx.donation.update({
        where: { id: claim.donationId },
        data: {
          status: 'received',
          confirmedPortions: { increment: raw },
        },
      });
      return c;
    });

    return NextResponse.json({ donationClaim: updatedClaim });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}