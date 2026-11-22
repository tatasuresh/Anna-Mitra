import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ROLES = ['donor', 'ngo', 'volunteer', 'admin'];

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const { donationId } = await params;
  if (!UUID_RE.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, ngoId: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: {
        id: true,
        restaurant: { select: { ownerUserId: true } },
      },
    });
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let involved = false;
    if (me.role === 'admin') {
      involved = true;
    } else if (me.role === 'donor') {
      involved = donation.restaurant.ownerUserId === me.id;
    } else if (me.role === 'ngo') {
      if (me.ngoId) {
        const claim = await prisma.donationClaim.findFirst({
          where: { donationId, ngoId: me.ngoId },
          select: { id: true },
        });
        involved = claim !== null;
      }
    } else if (me.role === 'volunteer') {
      const task = await prisma.pickupTask.findFirst({
        where: { donationId, volunteerUserId: me.id },
        select: { id: true },
      });
      involved = task !== null;
    }

    if (!involved) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const statusEvents = await prisma.statusEvent.findMany({
      where: { donationId },
      orderBy: [{ sequenceNo: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ statusEvents });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}