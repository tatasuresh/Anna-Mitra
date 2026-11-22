
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { expireOverdueDonations } from '@/lib/expiry';

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
  await expireOverdueDonations();

  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, ngoId: true },
    });
    if (!account) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (account.role !== 'ngo') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!account.ngoId) {
      return NextResponse.json(
        { error: 'No NGO is linked to this account' },
        { status: 403 },
      );
    }

    const ngo = await prisma.ngo.findUnique({ where: { id: account.ngoId } });
    if (!ngo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const capacity = await prisma.ngoCapacity.findFirst({ where: { ngoId: ngo.id } });
    const isAvailable = capacity?.isAvailable ?? false;
    const hasColdStorage = capacity?.hasColdStorage ?? false;

    if (!isAvailable) {
      return NextResponse.json({ donations: [], alerts: [] });
    }

    const now = new Date();
    const candidates = await prisma.donation.findMany({
      where: {
        status: { in: ['published', 'partially_claimed'] },
        portionsRemaining: { gt: 0 },
        pickupByAt: { gt: now },
        restaurant: { status: 'approved' },
      },
      include: {
        restaurant: true,
        handlingDeclarations: { select: { requiresRefrigeration: true } },
      },
      orderBy: { pickupByAt: 'asc' },
    });

    const ngoLat = toNumber(ngo.latitude);
    const ngoLon = toNumber(ngo.longitude);
    const radiusKm = toNumber(ngo.serviceRadiusKm);

    const donations: Array<{
      donation: Omit<(typeof candidates)[number], 'restaurant' | 'handlingDeclarations'>;
      distance_km: number;
      match_explanation: string;
    }> = [];
    const alerts: Array<{ message: string; donation_id: string }> = [];

    for (const candidate of candidates) {
      const { restaurant, handlingDeclarations, ...donationFields } = candidate;

      const needsRefrigeration = handlingDeclarations.some((d) => d.requiresRefrigeration);
      if (needsRefrigeration && !hasColdStorage) continue;

      const distance = haversineKm(
        toNumber(restaurant.latitude),
        toNumber(restaurant.longitude),
        ngoLat,
        ngoLon,
      );
      if (distance > radiusKm) continue;

      const distanceKm = Math.round(distance * 10) / 10;
      const matchExplanation = `${distanceKm.toFixed(1)} km away · ${donationFields.portionsRemaining} portions remaining`;

      donations.push({
        donation: donationFields,
        distance_km: distanceKm,
        match_explanation: matchExplanation,
      });
      alerts.push({
        message: `New donation nearby: ${donationFields.description} (${donationFields.portionsRemaining} portions)`,
        donation_id: donationFields.id,
      });
    }

    return NextResponse.json({ donations, alerts });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}