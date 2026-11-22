import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const ALLOWED_ROLES: string[] = ['volunteer', 'ngo', 'admin'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const { pickupTaskId } = await params;
  if (!UUID_RE.test(pickupTaskId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, ngoId: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pickupTask = await prisma.pickupTask.findUnique({
      where: { id: pickupTaskId },
    });
    if (!pickupTask) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (me.role === 'ngo') {
      if (!me.ngoId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      const claim = await prisma.donationClaim.findUnique({
        where: { id: pickupTask.claimId },
        select: { ngoId: true },
      });
      if (!claim || claim.ngoId !== me.ngoId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ pickupTask });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}