import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FOOD_TYPES = [
  'vegetarian',
  'non_vegetarian',
  'vegan',
  'dairy',
  'bakery',
  'cooked_meals',
  'fruits_vegetables',
  'packaged',
] as const;

type FoodType = (typeof FOOD_TYPES)[number];

type RouteContext = { params: Promise<{ restaurantId: string }> };

type PreferenceFields = Partial<{
  defaultPortions: number | null;
  preferredPickupStart: string | null;
  preferredPickupEnd: string | null;
  pickupNotes: string | null;
  defaultPickupWindow: string | null;
  defaultPickupWindowMinutes: number | null;
  preferredFoodTypes: FoodType[] | null;
}>;

const PREFERENCE_KEYS = [
  'defaultPortions',
  'preferredPickupStart',
  'preferredPickupEnd',
  'pickupNotes',
  'defaultPickupWindow',
  'defaultPickupWindowMinutes',
  'preferredFoodTypes',
] as const;

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function optionalShortString(value: unknown, max: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  if (value.length > max) return undefined;
  return value;
}

function validatePreferenceBody(
  raw: Record<string, unknown>,
): { data: PreferenceFields } | { error: string } {
  const data: PreferenceFields = {};

  if ('defaultPortions' in raw) {
    const v = raw.defaultPortions;
    if (v === null) {
      data.defaultPortions = null;
    } else if (!isWholeNumber(v) || v < 1 || v > 200) {
      return { error: 'Enter a whole number of portions between 1 and 200.' };
    } else {
      data.defaultPortions = v;
    }
  }

  if ('defaultPickupWindowMinutes' in raw) {
    const v = raw.defaultPickupWindowMinutes;
    if (v === null) {
      data.defaultPickupWindowMinutes = null;
    } else if (!isWholeNumber(v) || v < 15 || v > 240) {
      return { error: 'Enter a pickup window between 15 and 240 minutes.' };
    } else {
      data.defaultPickupWindowMinutes = v;
    }
  }

  if ('pickupNotes' in raw) {
    const v = raw.pickupNotes;
    if (v === null) {
      data.pickupNotes = null;
    } else {
      const notes = optionalShortString(v, 280);
      if (notes === undefined) {
        return { error: 'Pickup instructions must be 280 characters or fewer.' };
      }
      const trimmed = (notes ?? '').trim();
      data.pickupNotes = trimmed.length > 0 ? trimmed : null;
    }
  }

  if ('preferredFoodTypes' in raw) {
    const v = raw.preferredFoodTypes;
    if (v === null) {
      data.preferredFoodTypes = null;
    } else {
      if (
        !Array.isArray(v) ||
        v.length === 0 ||
        !v.every((item): item is FoodType =>
          typeof item === 'string' && (FOOD_TYPES as readonly string[]).includes(item),
        )
      ) {
        return { error: 'Select at least one food type from the list.' };
      }
      data.preferredFoodTypes = v;
    }
  }

  for (const key of ['preferredPickupStart', 'preferredPickupEnd', 'defaultPickupWindow'] as const) {
    if (key in raw) {
      const v = raw[key];
      if (v === null) {
        data[key] = null;
      } else {
        const text = optionalShortString(v, 50);
        if (text === undefined) {
          return { error: `${key} must be a short text value.` };
        }
        const trimmedText = (text ?? '').trim();
        data[key] = trimmedText.length > 0 ? trimmedText : null;
      }
    }
  }

  return { data };
}

async function restaurantExists(restaurantId: string): Promise<boolean> {
  if (!UUID_RE.test(restaurantId)) return false;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  return restaurant !== null;
}

export async function GET(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  try {
    const auth = await requireUser(request);
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const restaurantId = params.restaurantId;
    if (!(await restaurantExists(restaurantId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const preference = await prisma.restaurantPreference.findUnique({
      where: { restaurantId },
    });

    return NextResponse.json({ preference });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  if (!PREFERENCE_KEYS.some((key) => key in raw)) {
    return NextResponse.json(
      { error: 'No preference fields provided' },
      { status: 400 },
    );
  }

  const validated = validatePreferenceBody(raw);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const auth = await requireUser(request);
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const restaurantId = params.restaurantId;
    if (!(await restaurantExists(restaurantId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = validated.data;
    const preferredFoodTypesValue =
      data.preferredFoodTypes === null
        ? Prisma.DbNull
        : data.preferredFoodTypes;

    const fields: Partial<Prisma.RestaurantPreferenceUncheckedCreateInput> = {
      ...data,
      preferredFoodTypes: preferredFoodTypesValue,
    };

    const preference = await prisma.restaurantPreference.upsert({
      where: { restaurantId },
      create: {
        ...fields,
        restaurantId,
        updatedByUserId: auth.id,
      },
      update: {
        ...fields,
        updatedByUserId: auth.id,
      },
    });

    return NextResponse.json({ preference });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}