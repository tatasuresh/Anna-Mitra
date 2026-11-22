import { prisma } from '@/lib/db';

/**
 * Closes donations nobody claimed before their pickup-by time: status `published`
 * becomes `expired`, with a status event so the history shows why.
 *
 * There is no background scheduler, so this runs whenever a route lists donations.
 * It is cheap (one indexed query when nothing is overdue) and safe to call often:
 * the status change is conditional, so two requests racing never write it twice.
 */
export async function expireOverdueDonations(): Promise<number> {
  try {
    const overdue = await prisma.donation.findMany({
      where: { status: 'published', pickupByAt: { lte: new Date() } },
      select: { id: true, postedByUserId: true },
      take: 100,
    });

    let expired = 0;
    for (const donation of overdue) {
      await prisma.$transaction(async (tx) => {
        const changed = await tx.donation.updateMany({
          where: { id: donation.id, status: 'published' },
          data: { status: 'expired' },
        });
        if (changed.count === 0) return;

        const last = await tx.statusEvent.aggregate({
          where: { donationId: donation.id },
          _max: { sequenceNo: true },
        });
        await tx.statusEvent.create({
          data: {
            donationId: donation.id,
            actorUserId: donation.postedByUserId,
            fromStatus: 'published',
            toStatus: 'expired',
            reason: 'Pickup-by time passed before any NGO claimed it',
            eventType: 'donation_expired',
            sequenceNo: (last._max.sequenceNo ?? 0) + 1,
            recordType: 'donation',
            recordId: donation.id,
          },
        });
        expired += 1;
      });
    }
    return expired;
  } catch {
    // Housekeeping must never break the request that triggered it.
    return 0;
  }
}
