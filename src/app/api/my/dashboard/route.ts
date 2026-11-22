import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { expireOverdueDonations } from '@/lib/expiry';

const RECENT_LIMIT = 5;

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  await expireOverdueDonations();

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (!restaurant) {
      return NextResponse.json({
        restaurant: null,
        donations_published_this_month: 0,
        recent_donations: [],
      });
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [donationsPublishedThisMonth, recentRows] = await Promise.all([
      prisma.donation.count({
        where: {
          restaurantId: restaurant.id,
          publishedAt: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      prisma.donation.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
    ]);

    const recentDonations = await Promise.all(
      recentRows.map(async (donation) => {
        const latestEvent = await prisma.statusEvent.findFirst({
          where: { donationId: donation.id },
          orderBy: { sequenceNo: 'desc' },
        });
        return {
          ...donation,
          status: latestEvent?.toStatus ?? donation.status,
        };
      }),
    );

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        latitude: Number(restaurant.latitude),
        longitude: Number(restaurant.longitude),
      },
      donations_published_this_month: donationsPublishedThisMonth,
      recent_donations: recentDonations,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}