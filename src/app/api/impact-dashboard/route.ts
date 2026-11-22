import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { getSettingValue } from '@/lib/settings';

const COST_BASIS =
  'Illustrative only: confirmed portions on delivered donations linked to the sponsor campaign, multiplied by that campaign cost_per_portion. Demonstration figures; no payment or billing data is involved.';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const KG_PER_PORTION = await getSettingValue('kg_per_portion');
    const campaigns = await prisma.sponsorCampaign.findMany({
      where: { sponsorUserId: user.id },
      select: { id: true, costPerPortion: true },
    });

    const deliveredDonations = await prisma.donation.findMany({
      where: { status: 'received' },
      select: { id: true, sponsorCampaignId: true },
    });

    const deliveredIds = deliveredDonations.map((d) => d.id);

    const confirmedClaims =
      deliveredIds.length === 0
        ? []
        : await prisma.donationClaim.findMany({
            where: {
              donationId: { in: deliveredIds },
              status: 'confirmed',
              receivedAt: { not: null },
            },
            select: { donationId: true, portionsReceived: true },
          });

    const portionsByDonation = new Map<string, number>();
    let confirmedPortionsDelivered = 0;

    for (const claim of confirmedClaims) {
      const portions = claim.portionsReceived ?? 0;
      confirmedPortionsDelivered += portions;
      portionsByDonation.set(
        claim.donationId,
        (portionsByDonation.get(claim.donationId) ?? 0) + portions,
      );
    }

    const costRateByCampaign = new Map<string, number>(
      campaigns.map((c) => [c.id, Number(c.costPerPortion)]),
    );

    let illustrativeCost = 0;
    for (const donation of deliveredDonations) {
      if (!donation.sponsorCampaignId) continue;
      const rate = costRateByCampaign.get(donation.sponsorCampaignId);
      if (rate === undefined) continue;
      const portions = portionsByDonation.get(donation.id) ?? 0;
      illustrativeCost += portions * rate;
    }

    const estimatedWasteAvoidedKg =
      Math.round(confirmedPortionsDelivered * KG_PER_PORTION * 100) / 100;

    return NextResponse.json({
      confirmed_portions_delivered: confirmedPortionsDelivered,
      estimated_waste_avoided_kg: estimatedWasteAvoidedKg,
      illustrative_cost: Math.round(illustrativeCost * 100) / 100,
      assumptions: {
        kg_per_portion: KG_PER_PORTION,
        cost_basis: COST_BASIS,
        is_illustrative: true,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}