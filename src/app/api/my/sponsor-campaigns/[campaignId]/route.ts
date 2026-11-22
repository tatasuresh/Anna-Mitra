import { NextResponse } from 'next/server';
import { Prisma, SponsorCampaignStatus, type SponsorCampaign } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toSponsorCampaign(campaign: SponsorCampaign) {
  return {
    id: campaign.id,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    name: campaign.name,
    sponsorUserId: campaign.sponsorUserId,
    recognitionText: campaign.recognitionText,
    startsOn: campaign.startsOn.toISOString(),
    endsOn: campaign.endsOn.toISOString(),
    status: campaign.status,
    costPerPortion: Number(campaign.costPerPortion),
  };
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ campaignId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sponsorCampaignId = params.campaignId;
  if (!UUID_RE.test(sponsorCampaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const campaign = await prisma.sponsorCampaign.findFirst({
      where: { id: sponsorCampaignId, sponsorUserId: user.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const sponsorCampaign = toSponsorCampaign(campaign);

    return NextResponse.json({ sponsorCampaign });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ campaignId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sponsorCampaignId = params.campaignId;
  if (!UUID_RE.test(sponsorCampaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  try {
    const existing = await prisma.sponsorCampaign.findFirst({
      where: { id: sponsorCampaignId, sponsorUserId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: Prisma.SponsorCampaignUpdateInput = {};

    if ('name' in input) {
      if (typeof input.name !== 'string' || input.name.trim() === '') {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
      }
      data.name = input.name.trim();
    }

    if ('recognitionText' in input) {
      if (input.recognitionText !== null && typeof input.recognitionText !== 'string') {
        return NextResponse.json({ error: 'recognitionText must be a string or null' }, { status: 400 });
      }
      data.recognitionText = input.recognitionText as string | null;
    }

    if ('costPerPortion' in input) {
      if (
        typeof input.costPerPortion !== 'number' ||
        !Number.isFinite(input.costPerPortion) ||
        input.costPerPortion < 0
      ) {
        return NextResponse.json(
          { error: 'costPerPortion must be a non-negative number' },
          { status: 400 }
        );
      }
      data.costPerPortion = input.costPerPortion;
    }

    let nextStartsOn: Date = existing.startsOn;
    let nextEndsOn: Date = existing.endsOn;

    if ('startsOn' in input) {
      const startsOn = parseDate(input.startsOn);
      if (!startsOn) {
        return NextResponse.json({ error: 'startsOn must be a valid date' }, { status: 400 });
      }
      data.startsOn = startsOn;
      nextStartsOn = startsOn;
    }

    if ('endsOn' in input) {
      const endsOn = parseDate(input.endsOn);
      if (!endsOn) {
        return NextResponse.json({ error: 'endsOn must be a valid date' }, { status: 400 });
      }
      data.endsOn = endsOn;
      nextEndsOn = endsOn;
    }

    if (nextStartsOn.getTime() > nextEndsOn.getTime()) {
      return NextResponse.json(
        { error: 'startsOn must be on or before endsOn' },
        { status: 400 }
      );
    }

    if ('status' in input) {
      const nextStatus = typeof input.status === 'string' ? input.status.trim() : '';
      if (!(Object.values(SponsorCampaignStatus) as string[]).includes(nextStatus)) {
        return NextResponse.json(
          { error: `status must be one of: ${Object.values(SponsorCampaignStatus).join(', ')}` },
          { status: 400 }
        );
      }
      data.status = nextStatus as SponsorCampaignStatus;
    }

    const activeFlag = 'is_active' in input ? input.is_active : input.isActive;
    if (activeFlag !== undefined) {
      if (typeof activeFlag !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
      }
      data.status = activeFlag ? SponsorCampaignStatus.active : SponsorCampaignStatus.ended;
    }

    const updated = await prisma.sponsorCampaign.update({
      where: { id: existing.id },
      data,
    });

    const sponsorCampaign = toSponsorCampaign(updated);

    return NextResponse.json({ sponsorCampaign });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}