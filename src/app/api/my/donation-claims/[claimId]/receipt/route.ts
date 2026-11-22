import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawReceived =
    typeof body === 'object' && body !== null
      ? (body as { portions_received?: unknown }).portions_received
      : undefined;

  if (typeof rawReceived !== 'number' || !Number.isInteger(rawReceived)) {
    return NextResponse.json(
      { error: 'Enter the number of portions you received.' },
      { status: 400 },
    );
  }
  const portionsReceived = rawReceived;

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, ngoId: true },
    });

    if (!me || me.role !== 'ngo' || !me.ngoId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const claim = await prisma.donationClaim.findFirst({
      where: { id: params.claimId, ngoId: me.ngoId },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (portionsReceived < 0 || portionsReceived > claim.portionsClaimed) {
      return NextResponse.json(
        { error: 'Enter a whole number of portions from 0 to the claimed amount.' },
        { status: 400 },
      );
    }

    if (claim.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'The claim must be confirmed before receipt can be recorded.' },
        { status: 409 },
      );
    }

    if (claim.receivedAt) {
      return NextResponse.json(
        { error: 'Receipt has already been recorded for this claim.' },
        { status: 409 },
      );
    }

    const handedOverTask = await prisma.pickupTask.findFirst({
      where: { claimId: claim.id, status: 'handed_over' },
      select: { id: true },
    });

    if (!handedOverTask) {
      return NextResponse.json(
        { error: 'The pickup has not been handed over yet.' },
        { status: 409 },
      );
    }

    const updatedClaim = await prisma.donationClaim.update({
      where: { id: claim.id },
      data: {
        portionsReceived,
        receivedAt: new Date(),
      },
    });

    return NextResponse.json({ claim: updatedClaim });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}