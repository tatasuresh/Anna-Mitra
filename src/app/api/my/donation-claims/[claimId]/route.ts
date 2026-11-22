import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'ngo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { ngoId: true },
    });

    if (!me?.ngoId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const claim = await prisma.donationClaim.findFirst({
      where: { id: params.claimId, ngoId: me.ngoId },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: claim.donationId },
      select: {
        id: true,
        description: true,
        portionsTotal: true,
        portionsRemaining: true,
        pickupLocation: true,
        pickupByAt: true,
        status: true,
        publishedAt: true,
      },
    });

    const remainingSeconds = Math.max(
      0,
      Math.floor((claim.reservedUntil.getTime() - Date.now()) / 1000),
    );

    return NextResponse.json({
      claim: {
        ...claim,
        donation,
        remainingSeconds,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}