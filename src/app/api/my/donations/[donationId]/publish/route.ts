import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

type PublishableDonation = {
  id: string;
  description: string;
  portionsTotal: number;
  pickupByAt: Date;
  status: string;
  restaurant: { latitude: Prisma.Decimal; longitude: Prisma.Decimal };
  handlingDeclarations: {
    preparationTimeMinutes: number;
    allergens: string | null;
    checklistConfirmed: boolean;
  }[];
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

async function notifyMatchingNgos(donation: PublishableDonation): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !restKey) {
    console.warn('OneSignal is not configured; skipping NGO notification for donation', donation.id);
    return;
  }

  const restLat = Number(donation.restaurant.latitude.toString());
  const restLon = Number(donation.restaurant.longitude.toString());

  const ngos = await prisma.ngo.findMany({
    select: { id: true, latitude: true, longitude: true, serviceRadiusKm: true },
  });
  const matchedNgoIds = ngos
    .filter(
      (ngo) =>
        distanceKm(
          restLat,
          restLon,
          Number(ngo.latitude.toString()),
          Number(ngo.longitude.toString()),
        ) <= Number(ngo.serviceRadiusKm.toString()),
    )
    .map((ngo) => ngo.id);

  if (matchedNgoIds.length === 0) return;

  const ngoUsers = await prisma.user.findMany({
    where: { role: 'ngo', ngoId: { in: matchedNgoIds } },
    select: { id: true },
  });
  if (ngoUsers.length === 0) return;

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${restKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_aliases: { external_id: ngoUsers.map((u) => u.id) },
      headings: { en: 'New donation nearby' },
      contents: {
        en: `${donation.portionsTotal} portions of ${donation.description} are available for pickup`,
      },
    }),
  });

  if (!response.ok) {
    console.warn('OneSignal notification failed with status', response.status);
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ donationId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  const donationId = params.donationId;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!dbUser || dbUser.role !== 'donor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const donation = (await prisma.donation.findFirst({
      where: { id: donationId, restaurant: { ownerUserId: user.id } },
      include: {
        restaurant: { select: { latitude: true, longitude: true } },
        handlingDeclarations: {
          select: {
            preparationTimeMinutes: true,
            allergens: true,
            checklistConfirmed: true,
          },
        },
      },
    })) as PublishableDonation | null;

    if (!donation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (donation.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only a draft donation can be published' },
        { status: 409 },
      );
    }

    if (!(donation.portionsTotal > 0)) {
      return NextResponse.json(
        { error: 'Portions must be above zero before publishing' },
        { status: 400 },
      );
    }

    const now = new Date();
    if (new Date(donation.pickupByAt).getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'Pickup-by time must be in the future before publishing' },
        { status: 400 },
      );
    }

    const hasCompleteChecklist = donation.handlingDeclarations.some(
      (d) =>
        d.checklistConfirmed === true &&
        d.preparationTimeMinutes > 0 &&
        d.allergens !== null &&
        d.allergens.trim() !== '',
    );
    if (!hasCompleteChecklist) {
      return NextResponse.json(
        {
          error:
            'Complete the handling checklist (preparation time, storage/handling and allergens) before publishing',
        },
        { status: 400 },
      );
    }

    const published = await prisma.$transaction(async (tx) => {
      const maxSeq = await tx.statusEvent.aggregate({
        where: { donationId },
        _max: { sequenceNo: true },
      });
      const nextSeq = (maxSeq._max.sequenceNo ?? 0) + 1;

      const updated = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'published',
          publishedAt: now,
          portionsRemaining: donation.portionsTotal,
        },
      });

      await tx.statusEvent.create({
        data: {
          donationId,
          actorUserId: user.id,
          fromStatus: 'draft',
          toStatus: 'published',
          eventType: 'donation_published',
          sequenceNo: nextSeq,
          recordType: 'donation',
          recordId: donationId,
        },
      });

      return updated;
    });

    try {
      await notifyMatchingNgos(donation);
    } catch (notifyError) {
      console.warn('Failed to notify matching NGOs', notifyError);
    }

    return NextResponse.json({ donation: published });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}