import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const ELIGIBLE_STATUSES = ['published', 'partially_claimed'] as const;
const MAX_RESULTS = 200;

function toNumber(value: unknown): number {
  const n = Number(String(value));
  return Number.isFinite(n) ? n : Number.NaN;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function buildExplanation(params: {
  distanceKm: number;
  radiusKm: number;
  portionsAvailable: number;
  needPortions: number;
  maxPortionsPerClaim: number;
}): string {
  const parts: string[] = [];
  parts.push(
    `${params.distanceKm.toFixed(1)} km away, inside your ${params.radiusKm} km service radius`,
  );
  if (params.needPortions > 0) {
    parts.push(
      `${params.portionsAvailable} portions available against your need of ${params.needPortions}`,
    );
  } else {
    parts.push(`${params.portionsAvailable} portions available`);
  }
  if (params.maxPortionsPerClaim > 0) {
    const claimable = Math.min(params.maxPortionsPerClaim, params.portionsAvailable);
    parts.push(`you can claim up to ${claimable} portions in one claim`);
  }
  return parts.join('. ') + '.';
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (me.role !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!me.ngoId) {
      return NextResponse.json({ error: 'No NGO linked to this account' }, { status: 403 });
    }

    const ngo = await prisma.ngo.findUnique({ where: { id: me.ngoId } });
    if (!ngo || ngo.status !== 'approved') {
      return NextResponse.json({ error: 'NGO is not approved' }, { status: 403 });
    }

    const capacity = await prisma.ngoCapacity.findFirst({ where: { ngoId: ngo.id } });
    if (!capacity || !capacity.isAvailable) {
      return NextResponse.json({ donationMatches: [] });
    }

    const ngoLat = toNumber(ngo.latitude);
    const ngoLon = toNumber(ngo.longitude);
    const radiusKm = toNumber(ngo.serviceRadiusKm);
    if (!Number.isFinite(ngoLat) || !Number.isFinite(ngoLon) || !Number.isFinite(radiusKm)) {
      return NextResponse.json({ donationMatches: [] });
    }

    const rows = await prisma.donation.findMany({
      where: {
        status: { in: [...ELIGIBLE_STATUSES] },
        portionsRemaining: { gt: 0 },
        pickupByAt: { gt: new Date() },
        restaurant: { status: 'approved' },
      },
      include: {
        restaurant: true,
        handlingDeclarations: { select: { requiresRefrigeration: true } },
      },
      orderBy: { pickupByAt: 'asc' },
      take: MAX_RESULTS,
    });

    const donationMatches = rows.flatMap((row) => {
      const { restaurant, handlingDeclarations, ...donation } = row;

      const restaurantLat = toNumber(restaurant.latitude);
      const restaurantLon = toNumber(restaurant.longitude);
      if (!Number.isFinite(restaurantLat) || !Number.isFinite(restaurantLon)) {
        return [];
      }

      const distance = haversineKm(ngoLat, ngoLon, restaurantLat, restaurantLon);
      if (distance > radiusKm) {
        return [];
      }

      const needsCold = handlingDeclarations.some((d) => d.requiresRefrigeration);
      if (needsCold && !capacity.hasColdStorage) {
        return [];
      }

      return [
        {
          donation,
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            latitude: restaurantLat,
            longitude: restaurantLon,
            status: restaurant.status,
          },
          portions_available: donation.portionsRemaining,
          match_explanation: buildExplanation({
            distanceKm: distance,
            radiusKm,
            portionsAvailable: donation.portionsRemaining,
            needPortions: capacity.currentNeedPortions,
            maxPortionsPerClaim: capacity.maxPortionsPerClaim,
          }),
        },
      ];
    });

    return NextResponse.json({ donationMatches });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}