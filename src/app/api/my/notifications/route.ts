import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

interface AlertItem {
  id: string;
  type: string;
  message: string;
  donationId: string | null;
  createdAt: string;
}

const MAX_ALERTS = 50;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, restaurantId: true, ngoId: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const alerts: AlertItem[] = [];

    if (me.role === 'ngo' && me.ngoId) {
      const ngo = await prisma.ngo.findUnique({ where: { id: me.ngoId } });
      const capacity = await prisma.ngoCapacity.findUnique({ where: { ngoId: me.ngoId } });
      const available = capacity ? capacity.isAvailable : true;

      if (ngo && ngo.status === 'approved' && available) {
        const now = new Date();
        const donations = await prisma.donation.findMany({
          where: {
            status: { in: ['published', 'partially_claimed'] },
            portionsRemaining: { gt: 0 },
            pickupByAt: { gt: now },
          },
          orderBy: { publishedAt: 'desc' },
          take: 100,
        });

        const restaurantIds = Array.from(new Set(donations.map((d) => d.restaurantId)));
        const restaurants = restaurantIds.length
          ? await prisma.restaurant.findMany({ where: { id: { in: restaurantIds } } })
          : [];
        const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

        const ngoLat = ngo.latitude.toNumber();
        const ngoLon = ngo.longitude.toNumber();
        const radiusKm = ngo.serviceRadiusKm.toNumber();

        for (const donation of donations) {
          const restaurant = restaurantById.get(donation.restaurantId);
          if (!restaurant) continue;
          const distance = distanceKm(
            restaurant.latitude.toNumber(),
            restaurant.longitude.toNumber(),
            ngoLat,
            ngoLon,
          );
          if (distance > radiusKm) continue;

          alerts.push({
            id: `donation-eligible-${donation.id}`,
            type: 'donation_eligible',
            message: `${donation.description}: ${donation.portionsRemaining} portions, ${distance.toFixed(1)} km away`,
            donationId: donation.id,
            createdAt: (donation.publishedAt ?? donation.createdAt).toISOString(),
          });
        }
      }

      const claims = await prisma.donationClaim.findMany({
        where: { ngoId: me.ngoId },
        select: { id: true, donationId: true },
      });
      if (claims.length > 0) {
        const handedOver = await prisma.pickupTask.findMany({
          where: { claimId: { in: claims.map((c) => c.id) }, status: 'handed_over' },
          orderBy: { handedOverAt: 'desc' },
          take: 30,
        });
        const donationByClaim = new Map(claims.map((c) => [c.id, c.donationId]));
        for (const task of handedOver) {
          alerts.push({
            id: `handover-${task.id}`,
            type: 'handover_prompt',
            message: `${task.portionCount} portions handed over: confirm the quantity you received`,
            donationId: donationByClaim.get(task.claimId) ?? null,
            createdAt: (task.handedOverAt ?? task.updatedAt).toISOString(),
          });
        }
      }
    }

    if (me.role === 'donor' && me.restaurantId) {
      const donations = await prisma.donation.findMany({
        where: { restaurantId: me.restaurantId },
        select: { id: true, description: true },
        take: 200,
      });
      if (donations.length > 0) {
        const descriptionById = new Map(donations.map((d) => [d.id, d.description]));
        const events = await prisma.statusEvent.findMany({
          where: { donationId: { in: donations.map((d) => d.id) } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        for (const event of events) {
          alerts.push({
            id: `status-${event.id}`,
            type: 'status_changed',
            message: `${descriptionById.get(event.donationId) ?? 'Donation'}: status is now ${event.toStatus}`,
            donationId: event.donationId,
            createdAt: event.createdAt.toISOString(),
          });
        }
      }
    }

    if (me.role === 'volunteer') {
      const tasks = await prisma.pickupTask.findMany({
        where: { volunteerUserId: user.id, status: 'accepted' },
        orderBy: { acceptedAt: 'desc' },
        take: 30,
      });
      for (const task of tasks) {
        alerts.push({
          id: `pickup-${task.id}`,
          type: 'pickup_accepted',
          message: `Pickup accepted: ${task.portionCount} portions`,
          donationId: task.donationId,
          createdAt: (task.acceptedAt ?? task.updatedAt).toISOString(),
        });
      }
    }

    alerts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

    return NextResponse.json({ notifications: alerts.slice(0, MAX_ALERTS) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}