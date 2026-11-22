import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const DEFAULT_KG_PER_PORTION = 0.35;

function illustrativeRatePerPortion(): number {
  const raw = process.env.ILLUSTRATIVE_COST_PER_PORTION;
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  try {
    const impactReports = await prisma.impactReport.findMany({
      orderBy: { generatedAt: 'desc' },
    });
    return NextResponse.json({ impactReports });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof Response) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Missing required fields: period_start, period_end' },
      { status: 400 },
    );
  }

  const { period_start, period_end } = body as {
    period_start?: unknown;
    period_end?: unknown;
  };

  const periodStart = parseDate(period_start);
  const periodEnd = parseDate(period_end);

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: 'Missing required fields: period_start, period_end' },
      { status: 400 },
    );
  }

  if (periodEnd.getTime() < periodStart.getTime()) {
    return NextResponse.json(
      { error: 'period_end must not be before period_start' },
      { status: 400 },
    );
  }

  try {
    const aggregate = await prisma.donationClaim.aggregate({
      _sum: { portionsReceived: true },
      where: {
        status: 'confirmed',
        receivedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const confirmedPortions = aggregate._sum.portionsReceived ?? 0;
    const kgPerPortion = DEFAULT_KG_PER_PORTION;
    const estimatedWasteAvoidedKg =
      Math.round(confirmedPortions * kgPerPortion * 100) / 100;
    const illustrativeCost =
      Math.round(confirmedPortions * illustrativeRatePerPortion() * 100) / 100;

    const impactReport = await prisma.impactReport.create({
      data: {
        periodStart,
        periodEnd,
        confirmedPortions,
        kgPerPortionAssumption: kgPerPortion,
        estimatedWasteAvoidedKg,
        illustrativeCost,
        currency: 'INR',
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({ impactReport }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}