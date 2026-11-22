import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_FOOD_TYPES = [
  'cooked_meals',
  'vegetarian',
  'vegan',
  'bakery',
  'fruit_vegetables',
  'dairy',
  'grains',
  'beverages',
] as const;

type AllowedFoodType = (typeof ALLOWED_FOOD_TYPES)[number];

type RouteContext = { params: Promise<{ restaurantId: string }> };

type PreferenceInput = {
  defaultPortions: number | null;
  defaultPickupWindowMinutes: number | null;
  pickupNotes: string | null;
  preferredPickupStart: string | null;
  preferredPickupEnd: string | null;
  defaultPickupWindow: string | null;
  preferredFoodTypes: AllowedFoodType[] | null;
};

type ValidationResult =
  | { ok: true; data: PreferenceInput }
  | { ok: false; error: string };

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function optionalString(value: unknown, field: string): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be text.` };
  }
  return { ok: true, value: value.trim() === '' ? null : value.trim() };
}

function validatePreferences(raw: Record<string, unknown>): ValidationResult {
  // Only reusable defaults are accepted. Safety declarations (preparation time,
  // storage/handling, allergens) are never read from this payload.

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

  const notes = optionalString(raw.pickupNotes, 'Pickup instructions');
  if (!notes.ok) {
    return { ok: false, error: notes.error };
  }
  if (notes.value !== null && notes.value.length > 280) {
    return { ok: false, error: 'Pickup instructions must be 280 characters or fewer.' };
  }

  const start = optionalString(raw.preferredPickupStart, 'Preferred pickup start');
  if (!start.ok) return { ok: false, error: start.error };

  const end = optionalString(raw.preferredPickupEnd, 'Preferred pickup end');
  if (!end.ok) return { ok: false, error: end.error };

  const windowLabel = optionalString(raw.defaultPickupWindow, 'Default pickup window');
  if (!windowLabel.ok) return { ok: false, error: windowLabel.error };

  let preferredFoodTypes: AllowedFoodType[] | null = null;
  if (raw.preferredFoodTypes !== undefined && raw.preferredFoodTypes !== null) {
    const list = raw.preferredFoodTypes;
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, error: 'Select at least one food type from the list.' };
    }
    const allowed = new Set<string>(ALLOWED_FOOD_TYPES);
    const unique: AllowedFoodType[] = [];
    for (const item of list) {
      if (typeof item !== 'string' || !allowed.has(item)) {
        return { ok: false, error: 'Select at least one food type from the list.' };
      }
      if (!unique.includes(item as AllowedFoodType)) {
        unique.push(item as AllowedFoodType);
      }
    }
    preferredFoodTypes = unique;
  }

  return {
    ok: true,
    data: {
      defaultPortions,
      defaultPickupWindowMinutes,
      pickupNotes: notes.value,
      preferredPickupStart: start.value,
      preferredPickupEnd: end.value,
      defaultPickupWindow: windowLabel.value,
      preferredFoodTypes,
    },
  };
}

async function findOwnedRestaurant(restaurantId: string, userId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, ownerUserId: true },
  });
  if (!restaurant || restaurant.ownerUserId !== userId) {
    return null;
  }
  return restaurant;
}

export async function GET(request: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { restaurantId } = await params;
  if (!isUuid(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const restaurant = await findOwnedRestaurant(restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Missing preferences are reported as null and never created by a read.
    const preference = await prisma.restaurantPreference.findUnique({
      where: { restaurantId },
    });

    return NextResponse.json({ preference: preference ?? null });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'donor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { restaurantId } = await params;
  if (!isUuid(restaurantId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = (body as { preferences?: unknown } | null)?.preferences;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Missing preferences object' }, { status: 400 });
  }

  const validation = validatePreferences(raw as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const data = validation.data;

  try {
    const restaurant = await findOwnedRestaurant(restaurantId, user.id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const foodTypes = data.preferredFoodTypes ?? Prisma.DbNull;

    // Saving replaces the previous defaults; fields not sent are cleared.
    const preference = await prisma.restaurantPreference.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        updatedByUserId: user.id,
        defaultPortions: data.defaultPortions,
        defaultPickupWindowMinutes: data.defaultPickupWindowMinutes,
        pickupNotes: data.pickupNotes,
        preferredPickupStart: data.preferredPickupStart,
        preferredPickupEnd: data.preferredPickupEnd,
        defaultPickupWindow: data.defaultPickupWindow,
        preferredFoodTypes: foodTypes,
      },
      update: {
        updatedByUserId: user.id,
        defaultPortions: data.defaultPortions,
        defaultPickupWindowMinutes: data.defaultPickupWindowMinutes,
        pickupNotes: data.pickupNotes,
        preferredPickupStart: data.preferredPickupStart,
        preferredPickupEnd: data.preferredPickupEnd,
        defaultPickupWindow: data.defaultPickupWindow,
        preferredFoodTypes: foodTypes,
      },
    });

    return NextResponse.json({ preference });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}