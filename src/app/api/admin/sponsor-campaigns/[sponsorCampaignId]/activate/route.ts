import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ sponsorCampaignId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sponsorCampaignId = params.sponsorCampaignId;
  if (!UUID_PATTERN.test(sponsorCampaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const campaign = await prisma.sponsorCampaign.findUnique({
      where: { id: sponsorCampaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only a draft campaign can be activated' },
        { status: 409 },
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startsOn = new Date(campaign.startsOn);
    const endsOn = new Date(campaign.endsOn);
    startsOn.setUTCHours(0, 0, 0, 0);
    endsOn.setUTCHours(0, 0, 0, 0);

    if (today < startsOn || today > endsOn) {
      return NextResponse.json(
        { error: 'The campaign can only be activated within its start and end dates' },
        { status: 409 },
      );
    }

    const result = await prisma.sponsorCampaign.updateMany({
      where: { id: sponsorCampaignId, status: 'draft' },
      data: { status: 'active' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Only a draft campaign can be activated' },
        { status: 409 },
      );
    }

    const sponsorCampaign = await prisma.sponsorCampaign.findUnique({
      where: { id: sponsorCampaignId },
    });

    if (!sponsorCampaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ sponsorCampaign });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}