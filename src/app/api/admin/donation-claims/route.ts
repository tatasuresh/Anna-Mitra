import { NextResponse } from 'next/server';
import { ClaimStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const CLAIM_STATUSES: string[] = Object.values(ClaimStatus);

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get('status');
  if (status && !CLAIM_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Use one of: ${CLAIM_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const donationClaims = await prisma.donationClaim.findMany({
      where: status ? { status: status as ClaimStatus } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ donationClaims });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}