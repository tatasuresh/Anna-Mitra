import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, ngoId: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (me.role !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!me.ngoId) {
      return NextResponse.json({ donationClaims: [] });
    }

    const donationClaims = await prisma.donationClaim.findMany({
      where: { ngoId: me.ngoId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ donationClaims });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}