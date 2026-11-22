import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ pickupTaskId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pickupTaskId = params.pickupTaskId;
  if (!UUID_RE.test(pickupTaskId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const pickupTask = await prisma.pickupTask.findFirst({
      where: {
        id: pickupTaskId,
        volunteerUserId: user.id,
      },
    });

    if (!pickupTask) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ pickupTask });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}