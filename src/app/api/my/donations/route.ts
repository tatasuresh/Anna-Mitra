import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';

const INPUT_METHODS = ['voice', 'text', 'manual', 'repeat'] as const;
type InputMethod = (typeof INPUT_METHODS)[number];

function isInputMethod(value: unknown): value is InputMethod {
  return typeof value === 'string' && (INPUT_METHODS as readonly string[]).includes(value);
}

async function findDonorRestaurant(userId: string) {
  return prisma.restaurant.findFirst({ where: { ownerUserId: userId } });
}

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const restaurant = await findDonorRestaurant(user.id);
    if (!restaurant) {
      return NextResponse.json({ donations: [] });
    }

    const donations = await prisma.donation.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ donations });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const portionsTotal = body.portionsTotal;
  const pickupByRaw = typeof body.pickupByAt === 'string' ? body.pickupByAt : '';
  const inputMethodRaw = body.inputMethod ?? 'text';
  const aiExtracted = body.aiExtracted === true;

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'Description must be 500 characters or fewer' }, { status: 400 });
  }
  if (typeof portionsTotal !== 'number' || !Number.isInteger(portionsTotal) || portionsTotal <= 0) {
    return NextResponse.json({ error: 'Portions must be a whole number above zero' }, { status: 400 });
  }
  const pickupByAt = new Date(pickupByRaw);
  if (!pickupByRaw || Number.isNaN(pickupByAt.getTime())) {
    return NextResponse.json({ error: 'Pickup-by time must be a valid date' }, { status: 400 });
  }
  if (pickupByAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Pickup-by time must be in the future' }, { status: 400 });
  }
  if (!isInputMethod(inputMethodRaw)) {
    return NextResponse.json({ error: 'Invalid input method' }, { status: 400 });
  }

  try {
    const restaurant = await findDonorRestaurant(user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const pickupLocation =
      typeof body.pickupLocation === 'string' && body.pickupLocation.trim()
        ? body.pickupLocation.trim()
        : restaurant.name;

    const donation = await prisma.donation.create({
      data: {
        restaurantId: restaurant.id,
        postedByUserId: user.id,
        description,
        portionsTotal,
        pickupLocation,
        pickupByAt,
        inputMethod: inputMethodRaw,
        aiExtracted,
        status: 'draft',
      },
    });

    return NextResponse.json({ donation }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}