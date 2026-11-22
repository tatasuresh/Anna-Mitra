import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ sponsorCampaignId: string }> }
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
    const existing = await prisma.sponsorCampaign.findUnique({
      where: { id: sponsorCampaignId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status !== 'active') {
      return NextResponse.json(
        { error: 'Only an active campaign can be ended' },
        { status: 409 }
      );
    }

    // Guarded update so a concurrent change cannot end a campaign that is no longer active.
    const result = await prisma.sponsorCampaign.updateMany({
      where: { id: sponsorCampaignId, status: 'active' },
      data: { status: 'ended' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Only an active campaign can be ended' },
        { status: 409 }
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