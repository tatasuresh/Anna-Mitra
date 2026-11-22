import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const PORTION_ERROR =
  'Enter a whole number of portions between 0 and the allowed maximum.';
const AVAILABILITY_ERROR = 'Choose whether the NGO is accepting donations or paused.';

type CapacityInput = {
  currentNeedPortions?: number;
  capacityPortions?: number;
  maxPortionsPerClaim?: number;
  hasColdStorage?: boolean;
  isAvailable?: boolean;
};

type CapacityValues = {
  currentNeedPortions: number;
  capacityPortions: number;
  maxPortionsPerClaim: number;
  hasColdStorage: boolean;
  isAvailable: boolean;
};

function isWholeNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseCapacityInput(raw: unknown): { data: CapacityInput } | { error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Request body must be an object' };
  }
  const r = raw as Record<string, unknown>;
  const data: CapacityInput = {};

  if (r.currentNeedPortions !== undefined) {
    if (!isWholeNonNegative(r.currentNeedPortions)) return { error: PORTION_ERROR };
    data.currentNeedPortions = r.currentNeedPortions;
  }
  if (r.capacityPortions !== undefined) {
    if (!isWholeNonNegative(r.capacityPortions)) return { error: PORTION_ERROR };
    data.capacityPortions = r.capacityPortions;
  }
  if (r.maxPortionsPerClaim !== undefined) {
    if (!isWholeNonNegative(r.maxPortionsPerClaim)) return { error: PORTION_ERROR };
    data.maxPortionsPerClaim = r.maxPortionsPerClaim;
  }
  if (r.hasColdStorage !== undefined) {
    if (typeof r.hasColdStorage !== 'boolean') {
      return { error: 'Cold storage must be either yes or no.' };
    }
    data.hasColdStorage = r.hasColdStorage;
  }
  if (r.isAvailable !== undefined) {
    if (typeof r.isAvailable !== 'boolean') return { error: AVAILABILITY_ERROR };
    data.isAvailable = r.isAvailable;
  }

  return { data };
}

function checkPerClaimLimit(values: CapacityValues): string | null {
  if (values.maxPortionsPerClaim > values.capacityPortions) {
    return 'Maximum portions per claim cannot be above your carrying capacity.';
  }
  return null;
}

// Resolves the signed-in NGO account to its linked, approved NGO.
// Returns the ngoId, or a Response describing why capacity cannot be accessed.
async function resolveApprovedNgoId(request: Request): Promise<{ ngoId: string } | Response> {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, ngoId: true },
  });
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (account.role !== 'ngo') {
    return NextResponse.json({ error: 'Not available for your role' }, { status: 403 });
  }
  if (!account.ngoId) {
    return NextResponse.json({ error: 'No NGO is linked to this account' }, { status: 404 });
  }

  const ngo = await prisma.ngo.findUnique({
    where: { id: account.ngoId },
    select: { id: true, status: true },
  });
  if (!ngo) {
    return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
  }
  if (ngo.status !== 'approved') {
    return NextResponse.json(
      { error: 'Your NGO is not approved for capacity changes yet', ngoStatus: ngo.status },
      { status: 403 },
    );
  }

  return { ngoId: ngo.id };
}

export async function GET(request: Request) {
  const ctx = await resolveApprovedNgoId(request);
  if (ctx instanceof Response) return ctx;

  try {
    const ngoCapacity = await prisma.ngoCapacity.findUnique({
      where: { ngoId: ctx.ngoId },
    });
    if (!ngoCapacity) {
      return NextResponse.json({ error: 'Capacity record not found' }, { status: 404 });
    }
    return NextResponse.json({ ngoCapacity });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await resolveApprovedNgoId(request);
  if (ctx instanceof Response) return ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCapacityInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const values: CapacityValues = {
    currentNeedPortions: parsed.data.currentNeedPortions ?? 0,
    capacityPortions: parsed.data.capacityPortions ?? 0,
    maxPortionsPerClaim: parsed.data.maxPortionsPerClaim ?? 0,
    hasColdStorage: parsed.data.hasColdStorage ?? false,
    isAvailable: parsed.data.isAvailable ?? true,
  };

  const limitError = checkPerClaimLimit(values);
  if (limitError) {
    return NextResponse.json({ error: limitError }, { status: 400 });
  }

  try {
    const existing = await prisma.ngoCapacity.findUnique({
      where: { ngoId: ctx.ngoId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A capacity record already exists for this NGO' },
        { status: 409 },
      );
    }

    const ngoCapacity = await prisma.ngoCapacity.create({
      data: { ngoId: ctx.ngoId, ...values },
    });
    return NextResponse.json({ ngoCapacity }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { error: 'A capacity record already exists for this NGO' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await resolveApprovedNgoId(request);
  if (ctx instanceof Response) return ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCapacityInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
    const current = await prisma.ngoCapacity.findUnique({
      where: { ngoId: ctx.ngoId },
    });
    if (!current) {
      return NextResponse.json({ error: 'Capacity record not found' }, { status: 404 });
    }

    const merged: CapacityValues = {
      currentNeedPortions: parsed.data.currentNeedPortions ?? current.currentNeedPortions,
      capacityPortions: parsed.data.capacityPortions ?? current.capacityPortions,
      maxPortionsPerClaim: parsed.data.maxPortionsPerClaim ?? current.maxPortionsPerClaim,
      hasColdStorage: parsed.data.hasColdStorage ?? current.hasColdStorage,
      isAvailable: parsed.data.isAvailable ?? current.isAvailable,
    };

    const limitError = checkPerClaimLimit(merged);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 400 });
    }

    const ngoCapacity = await prisma.ngoCapacity.update({
      where: { ngoId: ctx.ngoId },
      data: merged,
    });
    return NextResponse.json({ ngoCapacity });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}