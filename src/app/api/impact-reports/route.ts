import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.impactReport.findMany({
      orderBy: { generatedAt: 'desc' },
    });

    const impactReports = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      confirmedPortions: r.confirmedPortions,
      kgPerPortionAssumption: Number(r.kgPerPortionAssumption),
      estimatedWasteAvoidedKg: Number(r.estimatedWasteAvoidedKg),
      illustrativeCost: Number(r.illustrativeCost),
      currency: r.currency,
      generatedAt: r.generatedAt.toISOString(),
    }));

    return NextResponse.json({ impactReports });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}