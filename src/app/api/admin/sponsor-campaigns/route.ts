import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const STATUSES = ['draft', 'active', 'ended'] as const;
type CampaignStatus = (typeof STATUSES)[number];

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  let status: CampaignStatus | undefined;
  if (statusParam) {
    if (!(STATUSES as readonly string[]).includes(statusParam)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }
    status = statusParam as CampaignStatus;
  }

  try {
    const rows = await prisma.sponsorCampaign.findMany({
      where: status ? { status } : undefined,
      orderBy: { startsOn: 'desc' },
      include: {
        sponsor: { select: { id: true, name: true, email: true } },
      },
    });

    const sponsorCampaigns = rows.map((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      name: c.name,
      sponsorUserId: c.sponsorUserId,
      recognitionText: c.recognitionText,
      startsOn: c.startsOn.toISOString(),
      endsOn: c.endsOn.toISOString(),
      status: c.status,
      costPerPortion: c.costPerPortion.toNumber(),
      sponsor: c.sponsor
        ? { id: c.sponsor.id, name: c.sponsor.name, email: c.sponsor.email }
        : null,
    }));

    return NextResponse.json({ sponsorCampaigns });
  } catch (e) {
    console.error('GET /api/admin/sponsor-campaigns failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const b = body as Record<string, unknown>;

  const missing: string[] = [];
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) missing.push('name');

  const sponsorUserId = typeof b.sponsorUserId === 'string' ? b.sponsorUserId.trim() : '';
  if (!sponsorUserId) missing.push('sponsorUserId');

  const startsOnRaw = typeof b.startsOn === 'string' ? b.startsOn : '';
  const endsOnRaw = typeof b.endsOn === 'string' ? b.endsOn : '';
  if (!startsOnRaw) missing.push('startsOn');
  if (!endsOnRaw) missing.push('endsOn');

  if (typeof b.costPerPortion !== 'number' || !Number.isFinite(b.costPerPortion)) {
    missing.push('costPerPortion');
  }

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 },
    );
  }

  const costPerPortion = b.costPerPortion as number;
  if (costPerPortion < 0) {
    return NextResponse.json(
      { error: 'costPerPortion must be zero or greater' },
      { status: 400 },
    );
  }

  const startsOn = new Date(startsOnRaw);
  const endsOn = new Date(endsOnRaw);
  if (Number.isNaN(startsOn.getTime()) || Number.isNaN(endsOn.getTime())) {
    return NextResponse.json(
      { error: 'startsOn and endsOn must be valid dates' },
      { status: 400 },
    );
  }

  if (endsOn.getTime() < startsOn.getTime()) {
    return NextResponse.json(
      { error: 'endsOn cannot be before startsOn' },
      { status: 400 },
    );
  }

  let recognitionText: string | null = null;
  if (b.recognitionText !== undefined && b.recognitionText !== null) {
    if (typeof b.recognitionText !== 'string') {
      return NextResponse.json(
        { error: 'recognitionText must be a string' },
        { status: 400 },
      );
    }
    recognitionText = b.recognitionText;
  }

  try {
    const sponsor = await prisma.user.findUnique({
      where: { id: sponsorUserId },
      select: { id: true, role: true },
    });

    if (!sponsor || sponsor.role !== 'csr_sponsor') {
      return NextResponse.json(
        { error: 'sponsorUserId must belong to a CSR sponsor account' },
        { status: 400 },
      );
    }

    const c = await prisma.sponsorCampaign.create({
      data: {
        name,
        sponsorUserId,
        recognitionText,
        startsOn,
        endsOn,
        status: 'draft',
        costPerPortion,
      },
      include: {
        sponsor: { select: { id: true, name: true, email: true } },
      },
    });

    const sponsorCampaign = {
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      name: c.name,
      sponsorUserId: c.sponsorUserId,
      recognitionText: c.recognitionText,
      startsOn: c.startsOn.toISOString(),
      endsOn: c.endsOn.toISOString(),
      status: c.status,
      costPerPortion: c.costPerPortion.toNumber(),
      sponsor: c.sponsor
        ? { id: c.sponsor.id, name: c.sponsor.name, email: c.sponsor.email }
        : null,
    };

    return NextResponse.json({ sponsorCampaign }, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/sponsor-campaigns failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}