import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/session';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, password } = (body ?? {}) as { token?: unknown; password?: unknown };

  if (typeof token !== 'string' || token.trim() === '') {
    return NextResponse.json({ error: 'Reset link is missing its token.' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Please enter a new password.' }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: 'Password must be at most 128 characters.' },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(token.trim());

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const invalidLink = NextResponse.json(
      { error: 'This reset link is invalid or has expired. Please request a new one.' },
      { status: 400 },
    );

    if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
      return invalidLink;
    }

    if (record.user.status !== 'approved') {
      return NextResponse.json(
        { error: 'This account is not allowed to reset its password.' },
        { status: 403 },
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // Guard against concurrent reuse: only the request that flips usedAt wins.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });

      if (claimed.count === 0) {
        return false;
      }

      await tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          passwordChangedAt: now,
          tokenVersion: { increment: 1 },
        },
      });

      return true;
    });

    if (!updated) {
      return invalidLink;
    }

    return NextResponse.json({
      message: 'Your password has been reset. You can now sign in with your new password.',
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}