import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function notifySuspension(email: string, name: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set; skipping suspension email');
    return;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: 'Anna Mitra <onboarding@resend.dev>',
      to: email,
      subject: 'Your Anna Mitra participation is suspended',
      text: `Hello ${name},\n\nYour participation in Anna Mitra has been suspended by an administrator. You will not be able to act on donations, claims, receipts or pickups until your account is reinstated.`,
    });
    if (error) {
      console.error('Failed to send suspension email', error);
    }
  } catch (err) {
    console.error('Failed to send suspension email', err);
  }
}

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ userId: string }> },
) {
  const params = await paramsPromise;
  const session = await requireUser(request);
  if (session instanceof Response) return session;

  const caller = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true },
  });
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = params.userId;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (userId === caller.id) {
    return NextResponse.json(
      { error: 'You cannot suspend your own account' },
      { status: 400 },
    );
  }

  let target;
  try {
    target = await prisma.user.findUnique({ where: { id: userId } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (target.status === 'suspended') {
    return NextResponse.json(
      { error: 'Account is already suspended' },
      { status: 409 },
    );
  }

  const now = new Date();
  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
        decidedAt: now,
        decidedByUserId: caller.id,
        lastSignedOutAt: now,
        sessionToken: null,
        tokenVersion: { increment: 1 },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  await notifySuspension(updated.email, updated.name);

  const { passwordHash: _passwordHash, ...safeUser } = updated;

  return NextResponse.json({ user: safeUser });
}