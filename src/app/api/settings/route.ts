import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { getAllSettings } from '@/lib/settings';

const ALLOWED_ROLES = ['ngo', 'csr_sponsor', 'admin'] as const;

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

    return NextResponse.json({ settings: await getAllSettings() });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}