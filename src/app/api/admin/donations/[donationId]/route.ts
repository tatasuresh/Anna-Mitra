import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type RouteContext = { params: Promise<{ donationId: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const donationId = params.donationId;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        handlingDeclarations: { orderBy: { createdAt: 'asc' } },
        claims: { orderBy: { createdAt: 'asc' } },
        statusEvents: { orderBy: { sequenceNo: 'asc' } },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ donation });
  } catch (e) {
    console.error('GET /api/admin/donations/[donationId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const donationId = params.donationId;
  if (!UUID_PATTERN.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  if ('status' in input) {
    return NextResponse.json(
      { error: 'Status moves follow the server transition rules and cannot be set here' },
      { status: 400 }
    );
  }

  const data: Prisma.DonationUncheckedUpdateInput = {};

  if ('description' in input) {
    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      return NextResponse.json({ error: 'description must be a non-empty string' }, { status: 400 });
    }
    data.description = input.description.trim();
  }

  if ('pickupLocation' in input) {
    if (typeof input.pickupLocation !== 'string' || input.pickupLocation.trim().length === 0) {
      return NextResponse.json({ error: 'pickupLocation must be a non-empty string' }, { status: 400 });
    }
    data.pickupLocation = input.pickupLocation.trim();
  }

  if ('portionsTotal' in input) {
    if (!isNonNegativeInt(input.portionsTotal)) {
      return NextResponse.json({ error: 'portionsTotal must be a whole number of 0 or more' }, { status: 400 });
    }
    data.portionsTotal = input.portionsTotal;
  }

  if ('portionsRemaining' in input) {
    if (!isNonNegativeInt(input.portionsRemaining)) {
      return NextResponse.json({ error: 'portionsRemaining must be a whole number of 0 or more' }, { status: 400 });
    }
    data.portionsRemaining = input.portionsRemaining;
  }

  if ('confirmedPortions' in input) {
    if (!isNonNegativeInt(input.confirmedPortions)) {
      return NextResponse.json({ error: 'confirmedPortions must be a whole number of 0 or more' }, { status: 400 });
    }
    data.confirmedPortions = input.confirmedPortions;
  }

  if ('pickupByAt' in input) {
    if (typeof input.pickupByAt !== 'string') {
      return NextResponse.json({ error: 'pickupByAt must be an ISO date string' }, { status: 400 });
    }
    const parsed = new Date(input.pickupByAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'pickupByAt must be a valid date' }, { status: 400 });
    }
    data.pickupByAt = parsed;
  }

  if ('photoUrl' in input) {
    if (input.photoUrl !== null && typeof input.photoUrl !== 'string') {
      return NextResponse.json({ error: 'photoUrl must be a string or null' }, { status: 400 });
    }
    data.photoUrl = input.photoUrl as string | null;
  }

  if ('sponsorCampaignId' in input) {
    if (input.sponsorCampaignId !== null && typeof input.sponsorCampaignId !== 'string') {
      return NextResponse.json({ error: 'sponsorCampaignId must be a string or null' }, { status: 400 });
    }
    data.sponsorCampaignId = input.sponsorCampaignId as string | null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields were provided' }, { status: 400 });
  }

  try {
    const existing = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { portionsTotal: true, portionsRemaining: true, confirmedPortions: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const nextTotal = data.portionsTotal ?? existing.portionsTotal;
    const nextRemaining = data.portionsRemaining ?? existing.portionsRemaining;
    const nextConfirmed = data.confirmedPortions ?? existing.confirmedPortions;

    if (nextRemaining > nextTotal) {
      return NextResponse.json(
        { error: 'portionsRemaining cannot exceed portionsTotal' },
        { status: 400 }
      );
    }
    if (nextConfirmed > nextTotal) {
      return NextResponse.json(
        { error: 'confirmedPortions cannot exceed portionsTotal' },
        { status: 400 }
      );
    }

    if (typeof data.sponsorCampaignId === 'string') {
      const campaign = await prisma.sponsorCampaign.findUnique({
        where: { id: data.sponsorCampaignId },
        select: { id: true },
      });
      if (!campaign) {
        return NextResponse.json({ error: 'Sponsor campaign not found' }, { status: 400 });
      }
    }

    const donation = await prisma.donation.update({
      where: { id: donationId },
      data,
    });

    return NextResponse.json({ donation });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('PATCH /api/admin/donations/[donationId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}