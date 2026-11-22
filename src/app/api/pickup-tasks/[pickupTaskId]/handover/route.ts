import { NextRequest, NextResponse } from 'next/server';
import { Prisma, type PickupTask } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ pickupTaskId: string }> };

type HandoverOutcome =
  | { kind: 'missing' }
  | { kind: 'conflict' }
  | { kind: 'ok'; task: PickupTask; ngoId: string | null };

async function notifyNgoOfHandover(ngoId: string | null, pickupTaskId: string): Promise<void> {
  if (!ngoId) return;

  const appId = process.env.ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !restKey) {
    console.warn('[handover] OneSignal is not configured; skipping NGO handover notification');
    return;
  }

  try {
    const ngoUsers = await prisma.user.findMany({
      where: { ngoId, status: 'approved' },
      select: { id: true },
    });
    const externalIds = ngoUsers.map((u) => u.id);
    if (externalIds.length === 0) return;

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${restKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: externalIds,
        headings: { en: 'Food handed over' },
        contents: {
          en: 'The volunteer has handed over the food. Please confirm the quantity you received.',
        },
        data: { pickupTaskId },
      }),
    });
    if (!res.ok) {
      console.warn(`[handover] OneSignal responded with ${res.status}`);
    }
  } catch (err) {
    console.warn('[handover] Failed to send NGO handover notification', err);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'volunteer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pickupTaskId = params.pickupTaskId;

  try {
    const outcome = await prisma.$transaction<HandoverOutcome>(async (tx) => {
      const current = await tx.pickupTask.findUnique({
        where: { id: pickupTaskId },
      });

      if (!current || current.volunteerUserId !== user.id) {
        return { kind: 'missing' };
      }

      if (current.status !== 'collected') {
        return { kind: 'conflict' };
      }

      const moved = await tx.pickupTask.updateMany({
        where: {
          id: pickupTaskId,
          volunteerUserId: user.id,
          status: 'collected',
        },
        data: {
          status: 'handed_over',
          handedOverAt: new Date(),
        },
      });

      if (moved.count === 0) {
        return { kind: 'conflict' };
      }

      const lastEvent = await tx.statusEvent.findFirst({
        where: { donationId: current.donationId },
        orderBy: { sequenceNo: 'desc' },
        select: { sequenceNo: true },
      });

      await tx.statusEvent.create({
        data: {
          donationId: current.donationId,
          pickupTaskId: current.id,
          actorUserId: user.id,
          fromStatus: 'collected',
          toStatus: 'handed_over',
          reason: null,
          eventType: 'pickup_handed_over',
          sequenceNo: (lastEvent?.sequenceNo ?? 0) + 1,
          recordType: 'PickupTask',
          recordId: current.id,
        },
      });

      const claim = await tx.donationClaim.findUnique({
        where: { id: current.claimId },
        select: { ngoId: true },
      });

      const task = await tx.pickupTask.findUniqueOrThrow({
        where: { id: pickupTaskId },
      });

      return { kind: 'ok', task, ngoId: claim?.ngoId ?? null };
    });

    if (outcome.kind === 'missing') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (outcome.kind === 'conflict') {
      return NextResponse.json(
        { error: 'Pickup must be collected before it can be handed over' },
        { status: 409 },
      );
    }

    await notifyNgoOfHandover(outcome.ngoId, pickupTaskId);

    return NextResponse.json({ pickupTask: outcome.task });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('[pickup-tasks/handover] failed', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}