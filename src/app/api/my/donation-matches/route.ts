import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const EARTH_RADIUS_KM = 6371;

function toNumber(value: unknown): number {
  return Number(String(value));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, status: true, ngoId: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (me.role !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (me.status !== 'approved') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 });
    }
    if (!me.ngoId) {
      return NextResponse.json({ error: 'No NGO linked to this account' }, { status: 403 });
    }

    const ngo = await prisma.ngo.findUnique({ where: { id: me.ngoId } });
    if (!ngo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const capacity = await prisma.ngoCapacity.findFirst({ where: { ngoId: ngo.id } });
    if (!capacity || !capacity.isAvailable) {
      return NextResponse.json({ matches: [], alerts: [] });
    }

    const now = new Date();
    const radiusKm = toNumber(ngo.serviceRadiusKm);
    const ngoLat = toNumber(ngo.latitude);
    const ngoLon = toNumber(ngo.longitude);

    const donations = await prisma.donation.findMany({
      where: {
        status: { in: ['published', 'partially_claimed'] },
        portionsRemaining: { gt: 0 },
        pickupByAt: { gt: now },
        restaurant: { status: 'approved' },
      },
      include: { restaurant: true },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });

    const matches = donations
      .map((donation) => {
        const distanceKm = haversineKm(
          toNumber(donation.restaurant.latitude),
          toNumber(donation.restaurant.longitude),
          ngoLat,
          ngoLon,
        );
        const roundedDistance = Math.round(distanceKm * 100) / 100;
        const matchReasons: string[] = [
          `Within your ${radiusKm} km service radius`,
          `${donation.portionsRemaining} portions still unclaimed`,
          `Pickup by ${donation.pickupByAt.toISOString()}`,
        ];
        return {
          donation,
          distance_km: roundedDistance,
          portions_available: donation.portionsRemaining,
          match_reasons: matchReasons,
          _distance: distanceKm,
        };
      })
      .filter((item) => item._distance <= radiusKm)
      .sort((a, b) => a._distance - b._distance)
      .map(({ _distance, ...rest }) => rest);

    const alerts = matches.slice(0, 10).map((item) => ({
      donation_id: item.donation.id,
      message: `New donation "${item.donation.description}" from ${item.donation.restaurant.name} is ${item.distance_km} km away`,
      created_at: (item.donation.publishedAt ?? item.donation.updatedAt).toISOString(),
    }));

    return NextResponse.json({ matches, alerts });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}