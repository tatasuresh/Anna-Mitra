import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ claimId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const claimId = params.claimId;
  if (!UUID_PATTERN.test(claimId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, ngoId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (dbUser.role !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const claim = await prisma.donationClaim.findUnique({
      where: { id: claimId },
      select: { id: true, ngoId: true },
    });

    if (!claim || !dbUser.ngoId || claim.ngoId !== dbUser.ngoId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const pickupTasks = await prisma.pickupTask.findMany({
      where: { claimId: claim.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}