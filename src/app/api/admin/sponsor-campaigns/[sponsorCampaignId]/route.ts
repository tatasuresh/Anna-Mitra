
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ sponsorCampaignId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const campaignId = params.sponsorCampaignId;
  if (!UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const sponsorCampaign = await prisma.sponsorCampaign.findUnique({
      where: { id: campaignId },
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

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ sponsorCampaignId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  if ('status' in input) {
    return NextResponse.json(
      { error: 'status cannot be changed here; use the activate or end action' },
      { status: 400 },
    );
  }

  const campaignId = params.sponsorCampaignId;
  if (!UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: Prisma.SponsorCampaignUncheckedUpdateInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
    }
    data.name = input.name.trim();
  }

  if (input.recognitionText !== undefined) {
    if (input.recognitionText !== null && typeof input.recognitionText !== 'string') {
      return NextResponse.json({ error: 'recognitionText must be a string or null' }, { status: 400 });
    }
    data.recognitionText = input.recognitionText as string | null;
  }

  let parsedStartsOn: Date | undefined;
  let parsedEndsOn: Date | undefined;

  if (input.startsOn !== undefined) {
    const d = parseDate(input.startsOn);
    if (!d) {
      return NextResponse.json({ error: 'startsOn must be a valid date' }, { status: 400 });
    }
    parsedStartsOn = d;
    data.startsOn = d;
  }

  if (input.endsOn !== undefined) {
    const d = parseDate(input.endsOn);
    if (!d) {
      return NextResponse.json({ error: 'endsOn must be a valid date' }, { status: 400 });
    }
    parsedEndsOn = d;
    data.endsOn = d;
  }

  if (input.costPerPortion !== undefined) {
    if (
      typeof input.costPerPortion !== 'number' ||
      !Number.isFinite(input.costPerPortion) ||
      input.costPerPortion < 0
    ) {
      return NextResponse.json(
        { error: 'costPerPortion must be zero or more' },
        { status: 400 },
      );
    }
    data.costPerPortion = input.costPerPortion;
  }

  if (input.sponsorUserId !== undefined) {
    if (typeof input.sponsorUserId !== 'string' || !UUID_RE.test(input.sponsorUserId)) {
      return NextResponse.json({ error: 'sponsorUserId must be a valid id' }, { status: 400 });
    }
  }

  try {
    const existing = await prisma.sponsorCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const effectiveStartsOn = parsedStartsOn ?? existing.startsOn;
    const effectiveEndsOn = parsedEndsOn ?? existing.endsOn;
    if (effectiveEndsOn.getTime() < effectiveStartsOn.getTime()) {
      return NextResponse.json(
        { error: 'endsOn must not be before startsOn' },
        { status: 400 },
      );
    }

    if (typeof input.sponsorUserId === 'string') {
      const sponsor = await prisma.user.findUnique({
        where: { id: input.sponsorUserId },
        select: { role: true },
      });
      if (!sponsor || sponsor.role !== 'csr_sponsor') {
        return NextResponse.json(
          { error: 'sponsorUserId must belong to a CSR sponsor account' },
          { status: 400 },
        );
      }
      data.sponsorUserId = input.sponsorUserId;
    }

    const sponsorCampaign = await prisma.sponsorCampaign.update({
      where: { id: campaignId },
      data,
    });

    return NextResponse.json({ sponsorCampaign });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ sponsorCampaignId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const campaignId = params.sponsorCampaignId;
  if (!UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const existing = await prisma.sponsorCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft sponsor campaigns can be deleted' },
        { status: 409 },
      );
    }

    await prisma.sponsorCampaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}