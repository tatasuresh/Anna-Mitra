import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ impactReportId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'csr_sponsor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const impactReportId = params.impactReportId;
  if (!UUID_PATTERN.test(impactReportId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const impactReport = await prisma.impactReport.findUnique({
      where: { id: impactReportId },
    });

    if (!impactReport) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ impactReport });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}