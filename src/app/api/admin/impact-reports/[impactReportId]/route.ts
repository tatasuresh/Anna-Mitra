import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ impactReportId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const impactReportId = params.impactReportId;

  try {
    const impactReport = await prisma.impactReport.findUnique({
      where: { id: impactReportId },
    });
    if (!impactReport) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ impactReport });
  } catch (e) {
    console.error('GET /api/admin/impact-reports/[impactReportId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ impactReportId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const impactReportId = params.impactReportId;

  try {
    await prisma.impactReport.delete({
      where: { id: impactReportId },
    });
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('DELETE /api/admin/impact-reports/[impactReportId] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}