import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const source = await prisma.donation.findUnique({
      where: { id: params.donationId },
      include: { restaurant: { select: { ownerUserId: true } } },
    });

    if (!source || source.restaurant.ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const donation = await prisma.donation.create({
      data: {
        restaurantId: source.restaurantId,
        postedByUserId: user.id,
        repeatedFromDonationId: source.id,
        description: source.description,
        portionsTotal: source.portionsTotal,
        portionsRemaining: 0,
        confirmedPortions: 0,
        pickupLocation: source.pickupLocation,
        pickupByAt: source.pickupByAt,
        inputMethod: 'repeat',
        aiExtracted: false,
        photoUrl: null,
        status: 'draft',
        publishedAt: null,
      },
    });

    return NextResponse.json({ donation }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}