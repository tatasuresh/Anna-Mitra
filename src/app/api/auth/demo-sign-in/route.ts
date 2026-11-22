import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sessionResponse } from '@/lib/session';

const DEMO_ROLES = ['donor', 'ngo', 'volunteer', 'admin', 'csr_sponsor'] as const;
type DemoRole = (typeof DEMO_ROLES)[number];

function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === 'string' && (DEMO_ROLES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const role =
    typeof body === 'object' && body !== null ? (body as { role?: unknown }).role : undefined;

  if (!isDemoRole(role)) {
    return NextResponse.json(
      { error: 'Role must be one of: donor, ngo, volunteer, admin, csr_sponsor' },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { isDemo: true, role, status: 'approved' },
      select: {
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
        organisationName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Demo account not found' }, { status: 404 });
    }

    return sessionResponse({ user }, user);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}