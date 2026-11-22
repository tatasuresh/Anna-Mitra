import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_FOOD_TYPES = new Set<string>([
  'vegetarian',
  'non_vegetarian',
  'vegan',
  'rice_dishes',
  'breads',
  'curries',
  'desserts',
  'snacks',
  'beverages',
  'bakery',
]);

type PreferenceInput = {
  defaultPortions: number | null;
  defaultPickupWindowMinutes: number | null;
  pickupNotes: string | null;
  preferredFoodTypes: string[] | null;
};

type ParseResult = { ok: true; value: PreferenceInput } | { ok: false; error: string };

function parsePreferenceBody(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const raw = body as Record<string, unknown>;

  // Safety declarations are never accepted here; only the four reusable defaults are read.
  let defaultPortions: number | null = null;
  if (raw.defaultPortions !== undefined && raw.defaultPortions !== null) {
    const v = raw.defaultPortions;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 200) {
      return { ok: false, error: 'Enter a whole number of portions between 1 and 200.' };
    }
    defaultPortions = v;
  }

  let defaultPickupWindowMinutes: number | null = null;
  if (raw.defaultPickupWindowMinutes !== undefined && raw.defaultPickupWindowMinutes !== null) {
    const v = raw.defaultPickupWindowMinutes;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 15 || v > 240) {
      return { ok: false, error: 'Enter a pickup window between 15 and 240 minutes.' };
    }
    defaultPickupWindowMinutes = v;
  }

  let pickupNotes: string | null = null;
  if (raw.pickupNotes !== undefined && raw.pickupNotes !== null) {
    if (typeof raw.pickupNotes !== 'string') {
      return { ok: false, error: 'Pickup instructions must be 280 characters or fewer.' };
    }
    const trimmed = raw.pickupNotes.trim();
    if (trimmed.length > 280) {
      return { ok: false, error: 'Pickup instructions must be 280 characters or fewer.' };
    }
    pickupNotes = trimmed.length > 0 ? trimmed : null;
  }

  let preferredFoodTypes: string[] | null = null;
  if (raw.preferredFoodTypes !== undefined && raw.preferredFoodTypes !== null) {
    const list = raw.preferredFoodTypes;
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, error: 'Select at least one food type from the list.' };
    }
    const unique = new Set<string>();
    for (const item of list) {
      if (typeof item !== 'string' || !ALLOWED_FOOD_TYPES.has(item)) {
        return { ok: false, error: 'Select at least one food type from the list.' };
      }
      unique.add(item);
    }
    preferredFoodTypes = Array.from(unique);
  }

  return {
    ok: true,
    value: { defaultPortions, defaultPickupWindowMinutes, pickupNotes, preferredFoodTypes },
  };
}

async function loadOwnedRestaurant(restaurantId: string, userId: string) {
  if (!UUID_RE.test(restaurantId)) return null;
  return prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerUserId: userId },
    select: { id: true },
  });
}

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const restaurant = await loadOwnedRestaurant(params.restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Read-only: a missing preference row is reported as null and never created here.
    const restaurantPreference = await prisma.restaurantPreference.findUnique({
      where: { restaurantId: restaurant.id },
    });

    return NextResponse.json({ restaurantPreference: restaurantPreference ?? null });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ restaurantId: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parsePreferenceBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.value;

  try {
    const restaurant = await loadOwnedRestaurant(params.restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const restaurantPreference = await prisma.restaurantPreference.upsert({
      where: { restaurantId: restaurant.id },
      create: {
        restaurantId: restaurant.id,
        defaultPortions: input.defaultPortions,
        defaultPickupWindowMinutes: input.defaultPickupWindowMinutes,
        pickupNotes: input.pickupNotes,
        preferredFoodTypes: input.preferredFoodTypes ?? Prisma.DbNull,
        updatedByUserId: user.id,
      },
      update: {
        defaultPortions: input.defaultPortions,
        defaultPickupWindowMinutes: input.defaultPickupWindowMinutes,
        pickupNotes: input.pickupNotes,
        preferredFoodTypes: input.preferredFoodTypes ?? Prisma.DbNull,
        updatedByUserId: user.id,
      },
    });

    return NextResponse.json({ restaurantPreference });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}