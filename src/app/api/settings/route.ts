import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const ALLOWED_ROLES = ['ngo', 'csr_sponsor', 'admin'] as const;

type Setting = {
  key: string;
  value: number | string | boolean;
  description: string;
};

// Configurable defaults. The PATCH /api/admin/settings/{settingKey} route owns changes.
const DEFAULT_SETTINGS: Setting[] = [
  {
    key: 'reservation_timeout_minutes',
    value: 5,
    description: 'Minutes an NGO claim stays reserved before it must be confirmed.',
  },
  {
    key: 'kg_per_portion',
    value: 0.35,
    description: 'Impact assumption: estimated kilograms of food per confirmed portion.',
  },
];

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  try {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!row) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(ALLOWED_ROLES as readonly string[]).includes(row.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}