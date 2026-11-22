
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const { donationId } = await params;
  if (!UUID_RE.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, ngoId: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { restaurant: true },
    });
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let allowed = false;

    if (dbUser.role === 'admin') {
      allowed = true;
    } else if (dbUser.role === 'donor') {
      allowed = donation.restaurant.ownerUserId === dbUser.id;
    } else if (dbUser.role === 'ngo') {
      if (dbUser.ngoId) {
        const claim = await prisma.donationClaim.findFirst({
          where: { donationId, ngoId: dbUser.ngoId },
          select: { id: true },
        });
        if (claim) {
          allowed = true;
        } else {
          const claimable =
            (donation.status === 'published' || donation.status === 'partially_claimed') &&
            donation.portionsRemaining > 0 &&
            donation.pickupByAt.getTime() > Date.now();
          allowed = claimable;
        }
      }
    } else if (dbUser.role === 'volunteer') {
      const task = await prisma.pickupTask.findFirst({
        where: { donationId, volunteerUserId: dbUser.id },
        select: { id: true },
      });
      allowed = !!task;
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    const { restaurant, ...donationFields } = donation;

    return NextResponse.json({ donation: donationFields, restaurant });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}