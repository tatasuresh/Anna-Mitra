import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ ngoId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ngoId } = await params;
  if (!UUID_RE.test(ngoId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown = {};
  const raw = await request.text().catch(() => '');
  if (raw.trim().length > 0) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  const reason =
    body && typeof body === 'object' && 'reason' in body
      ? (body as { reason?: unknown }).reason
      : undefined;

  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string' || reason.length > 300) {
      return NextResponse.json(
        { error: 'Reason must be a string of at most 300 characters' },
        { status: 400 }
      );
    }
  }

  try {
    const ngo = await prisma.ngo.update({
      where: { id: ngoId },
      data: { status: 'suspended' },
    });

    return NextResponse.json({ ngo });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}