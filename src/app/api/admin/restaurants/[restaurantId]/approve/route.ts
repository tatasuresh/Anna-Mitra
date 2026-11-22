import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function notifyOwnerApproved(email: string, name: string, restaurantName: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping restaurant approval email.');
    return;
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Anna Mitra <onboarding@resend.dev>',
      to: email,
      subject: `Your restaurant "${restaurantName}" is approved`,
      text: `Hello ${name},\n\nYour restaurant "${restaurantName}" has been approved. You can now post surplus food donations on Anna Mitra.\n\nThank you for joining the rescue.`,
    });
  } catch (err) {
    console.warn('Failed to send restaurant approval email:', err);
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> },
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const restaurantId = params.restaurantId;
  if (!UUID_RE.test(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let restaurant;
  let ownerEmail: string | null = null;
  let ownerName = '';

  try {
    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { ownerUser: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status === 'approved') {
      return NextResponse.json(
        { error: 'Restaurant is already approved' },
        { status: 409 },
      );
    }

    restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: 'approved' },
    });

    ownerEmail = existing.ownerUser?.email ?? null;
    ownerName = existing.ownerUser?.name ?? '';
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  if (ownerEmail) {
    await notifyOwnerApproved(ownerEmail, ownerName, restaurant.name);
  }

  return NextResponse.json({ restaurant });
}