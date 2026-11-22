import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 300;

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { restaurantId } = await params;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    body = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const reason = (body as { reason?: unknown } | null)?.reason;
  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      return NextResponse.json({ error: 'reason must be a string' }, { status: 400 });
    }
    if (reason.trim().length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `reason must be ${MAX_REASON_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }
  }

  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: 'suspended' },
    });
    return NextResponse.json({ restaurant });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}