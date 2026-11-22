
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toPublicUser(u: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
  role: string;
  status: string;
  isDemo: boolean;
  restaurantId: string | null;
  ngoId: string | null;
  isAvailable: boolean;
  carryingCapacity: number | null;
  decidedAt: Date | null;
  decidedByUserId: string | null;
  lastSignedOutAt: Date | null;
  organisationName: string | null;
  passwordChangedAt: Date | null;
}) {
  return {
    id: u.id,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    isDemo: u.isDemo,
    restaurantId: u.restaurantId,
    ngoId: u.ngoId,
    isAvailable: u.isAvailable,
    carryingCapacity: u.carryingCapacity,
    decidedAt: u.decidedAt,
    decidedByUserId: u.decidedByUserId,
    lastSignedOutAt: u.lastSignedOutAt,
    organisationName: u.organisationName,
    passwordChangedAt: u.passwordChangedAt,
  };
}

async function notifyApprovalDecision(email: string, name: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping approval email.');
    return;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Anna Mitra <onboarding@resend.dev>',
      to: email,
      subject: 'Your Anna Mitra account has been approved',
      text: `Hello ${name},\n\nYour Anna Mitra account has been approved. You can now sign in and take part in rescues.\n\nThank you for helping reduce food waste.`,
    });
  } catch (err) {
    console.error('Failed to send approval email', err);
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ userId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (target.status === 'approved') {
      return NextResponse.json(
        { error: 'Account is already approved' },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'approved',
        decidedAt: new Date(),
        decidedByUserId: user.id,
      },
    });

    await notifyApprovalDecision(updated.email, updated.name);

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}