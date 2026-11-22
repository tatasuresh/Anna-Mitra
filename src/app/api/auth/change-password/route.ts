import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, hashPassword, verifyPassword } from '@/lib/session';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = (body ?? {}) as { current_password?: unknown; new_password?: unknown };
  const currentPassword = typeof payload.current_password === 'string' ? payload.current_password : '';
  const newPassword = typeof payload.new_password === 'string' ? payload.new_password : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Missing required fields: current_password, new_password' },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!account.passwordHash) {
      return NextResponse.json(
        { error: 'No password is set for this account' },
        { status: 400 },
      );
    }

    const matches = await verifyPassword(currentPassword, account.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: account.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}