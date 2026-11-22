import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { expireOverdueDonations } from '@/lib/expiry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ donationId: string }> };

async function authorizeDonor(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  await expireOverdueDonations();
  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const auth = await authorizeDonor(request);
  if (auth instanceof Response) return auth;

  const { donationId } = await params;
  if (!UUID_RE.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const donation = await prisma.donation.findFirst({
      where: { id: donationId, restaurant: { ownerUserId: auth.id } },
      include: {
        handlingDeclarations: true,
        statusEvents: { orderBy: { sequenceNo: 'asc' } },
      },
    });
    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ donation });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const auth = await authorizeDonor(request);
  if (auth instanceof Response) return auth;

  const { donationId } = await params;
  if (!UUID_RE.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const existing = await prisma.donation.findFirst({
      where: { id: donationId, restaurant: { ownerUserId: auth.id } },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft donations can be edited' },
        { status: 409 },
      );
    }

    const data: Prisma.DonationUpdateInput = {};

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim() === '') {
        return NextResponse.json(
          { error: 'Description must be a non-empty string' },
          { status: 400 },
        );
      }
      data.description = body.description.trim();
    }

    if (body.portionsTotal !== undefined) {
      const portions = body.portionsTotal;
      if (typeof portions !== 'number' || !Number.isInteger(portions) || portions <= 0) {
        return NextResponse.json(
          { error: 'Portions must be a whole number above zero' },
          { status: 400 },
        );
      }
      data.portionsTotal = portions;
      data.portionsRemaining = portions;
    }

    if (body.pickupByAt !== undefined) {
      const pickupBy =
        typeof body.pickupByAt === 'string' ? new Date(body.pickupByAt) : null;
      if (!pickupBy || Number.isNaN(pickupBy.getTime())) {
        return NextResponse.json(
          { error: 'Pickup-by time must be a valid date' },
          { status: 400 },
        );
      }
      if (pickupBy.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Pickup-by time must be in the future' },
          { status: 400 },
        );
      }
      data.pickupByAt = pickupBy;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No editable fields provided' },
        { status: 400 },
      );
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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const auth = await authorizeDonor(request);
  if (auth instanceof Response) return auth;

  const { donationId } = await params;
  if (!UUID_RE.test(donationId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const existing = await prisma.donation.findFirst({
      where: { id: donationId, restaurant: { ownerUserId: auth.id } },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Published donations cannot be deleted' },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.handlingDeclaration.deleteMany({ where: { donationId } }),
      prisma.donation.delete({ where: { id: donationId } }),
    ]);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}