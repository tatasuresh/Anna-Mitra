import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { expireOverdueDonations } from '@/lib/expiry';

// Donation statuses are the schema's DonationStatus enum. The atlas label
// "delivered" maps to the enum value `received` (donation fully confirmed by the NGO).
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  await expireOverdueDonations();

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const ownDonations = { postedByUserId: user.id };

    const [published, claimed, delivered, recentDonations] = await Promise.all([
      prisma.donation.count({ where: { ...ownDonations, status: 'published' } }),
      prisma.donation.count({ where: { ...ownDonations, status: 'claimed' } }),
      prisma.donation.count({ where: { ...ownDonations, status: 'received' } }),
      prisma.donation.findMany({
        where: ownDonations,
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      published,
      claimed,
      delivered,
      recent_donations: recentDonations,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}