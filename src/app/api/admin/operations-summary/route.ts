import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [pendingApprovals, activeRescues, failedAssignments, suspendedUsers] =
      await Promise.all([
        prisma.user.count({ where: { status: 'pending_approval' } }),
        prisma.donation.count({
          where: { status: { in: ['claimed', 'in_transit'] } },
        }),
        prisma.pickupTask.count({ where: { status: 'failed' } }),
        prisma.user.count({ where: { status: 'suspended' } }),
      ]);

    return NextResponse.json({
      summary: {
        pending_approvals: pendingApprovals,
        active_rescues: activeRescues,
        failed_assignments: failedAssignments,
        suspended_users: suspendedUsers,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}