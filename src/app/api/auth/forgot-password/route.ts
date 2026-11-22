import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

const GENERIC_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Resend is not configured' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawEmail =
    typeof body === 'object' && body !== null && 'email' in body
      ? (body as { email?: unknown }).email
      : undefined;

  if (typeof rawEmail !== 'string' || rawEmail.trim() === '') {
    return NextResponse.json(
      { error: 'Please enter the email address on your account.' },
      { status: 400 },
    );
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: 'Enter a valid email address, such as name@example.com.' },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (user && user.status === 'approved') {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const requestedAt = new Date();
      const expiresAt = new Date(requestedAt.getTime() + TOKEN_TTL_MS);

      // Each new request replaces any previously issued token for this user.
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            requestedAt,
            expiresAt,
          },
        }),
      ]);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: 'Anna Mitra <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your Anna Mitra password',
        text:
          `We received a request to reset the password for your Anna Mitra account.\n\n` +
          `Reset your password using this link: ${resetLink}\n\n` +
          `This link expires in 60 minutes. If you did not request a reset, you can ignore this email.`,
      });

      if (error) {
        console.warn('Password reset email could not be sent', error.name);
      }
    }
  } catch (err) {
    console.error('Forgot-password request failed', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
}