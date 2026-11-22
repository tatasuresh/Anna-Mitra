import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SIGNUP_ROLES = ['donor', 'ngo', 'volunteer', 'csr_sponsor'] as const;
type SignupRole = (typeof SIGNUP_ROLES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const publicUserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  email: true,
  role: true,
  status: true,
  isDemo: true,
  restaurantId: true,
  ngoId: true,
  isAvailable: true,
  carryingCapacity: true,
  decidedAt: true,
  decidedByUserId: true,
  lastSignedOutAt: true,
  organisationName: true,
  passwordChangedAt: true,
} as const;

function isSignupRole(value: string): value is SignupRole {
  return (SIGNUP_ROLES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email, password, role' },
      { status: 400 },
    );
  }

  const { name, email, password, role } = body as Record<string, unknown>;

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof role !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: name, email, password, role' },
      { status: 400 },
    );
  }

  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  if (!isSignupRole(role)) {
    return NextResponse.json(
      { error: 'Role must be one of: donor, ngo, volunteer, csr_sponsor' },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        role,
        status: 'pending_approval',
      },
      select: publicUserSelect,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}