import { NextResponse } from 'next/server';
import { DonationStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set<string>(Object.values(DonationStatus));

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const raw = new URL(request.url).searchParams.get('status');
  let statuses: DonationStatus[] | undefined;

  if (raw) {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const invalid = parts.filter((s) => !VALID_STATUSES.has(s));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Unknown donation status: ${invalid.join(', ')}` },
        { status: 400 },
      );
    }
    statuses = parts as DonationStatus[];
  }

  try {
    const donations = await prisma.donation.findMany({
      where: statuses ? { status: { in: statuses } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ donations });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}