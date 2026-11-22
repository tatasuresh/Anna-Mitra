import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const PICKUP_TASK_STATUSES = ['open', 'accepted', 'collected', 'handed_over', 'failed'] as const;
type PickupTaskStatusValue = (typeof PICKUP_TASK_STATUSES)[number];

function isPickupTaskStatus(value: string): value is PickupTaskStatusValue {
  return (PICKUP_TASK_STATUSES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const statusParam = new URL(request.url).searchParams.get('status');
  if (statusParam !== null && statusParam !== '' && !isPickupTaskStatus(statusParam)) {
    return NextResponse.json(
      { error: `status must be one of: ${PICKUP_TASK_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const pickupTasks = await prisma.pickupTask.findMany({
      where: statusParam && isPickupTaskStatus(statusParam) ? { status: statusParam } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pickupTasks });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}