import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type CampaignRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  sponsorUserId: string;
  recognitionText: string | null;
  startsOn: Date;
  endsOn: Date;
  status: string;
  costPerPortion: unknown;
};

function toWire(c: CampaignRow) {
  return {
    id: c.id,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    name: c.name,
    sponsorUserId: c.sponsorUserId,
    recognitionText: c.recognitionText,
    startsOn: c.startsOn.toISOString().slice(0, 10),
    endsOn: c.endsOn.toISOString().slice(0, 10),
    status: c.status,
    costPerPortion: Number(c.costPerPortion),
  };
}

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.sponsorCampaign.findMany({
      where: { sponsorUserId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ sponsorCampaigns: rows.map(toWire) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const recognitionText =
    typeof b.recognitionText === 'string' && b.recognitionText.trim() !== ''
      ? b.recognitionText.trim()
      : null;

  const startsOn = parseDateOnly(b.startsOn);
  if (!startsOn) {
    return NextResponse.json(
      { error: 'startsOn must be a valid date (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  const endsOn = parseDateOnly(b.endsOn);
  if (!endsOn) {
    return NextResponse.json(
      { error: 'endsOn must be a valid date (YYYY-MM-DD)' },
      { status: 400 },
    );
  }

  if (startsOn.getTime() > endsOn.getTime()) {
    return NextResponse.json(
      { error: 'startsOn must not be after endsOn' },
      { status: 400 },
    );
  }

  let costPerPortion = 0;
  if (b.costPerPortion !== undefined && b.costPerPortion !== null) {
    const parsed =
      typeof b.costPerPortion === 'number'
        ? b.costPerPortion
        : typeof b.costPerPortion === 'string' && b.costPerPortion.trim() !== ''
          ? Number(b.costPerPortion)
          : Number.NaN;
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json(
        { error: 'costPerPortion must be zero or more' },
        { status: 400 },
      );
    }
    costPerPortion = parsed;
  }

  try {
    const created = await prisma.sponsorCampaign.create({
      data: {
        name,
        sponsorUserId: user.id,
        recognitionText,
        startsOn,
        endsOn,
        costPerPortion,
      },
    });
    return NextResponse.json({ sponsorCampaign: toWire(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}