import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';

type SettingRule = {
  min: number;
  max: number;
  integer: boolean;
  message: string;
};

const SETTING_RULES: Record<string, SettingRule> = {
  reservation_timeout_minutes: {
    min: 1,
    max: 60,
    integer: true,
    message: 'Reservation timeout must be a whole number of minutes between 1 and 60.',
  },
  kg_per_portion: {
    min: 0.01,
    max: 10,
    integer: false,
    message: 'Kilograms per portion must be a number between 0.01 and 10.',
  },
};

function validateValue(settingKey: string, value: unknown): { ok: true; value: number } | { ok: false; error: string } {
  const rule = SETTING_RULES[settingKey];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: rule.message };
  }
  if (rule.integer && !Number.isInteger(value)) {
    return { ok: false, error: rule.message };
  }
  if (value < rule.min || value > rule.max) {
    return { ok: false, error: rule.message };
  }
  return { ok: true, value };
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ settingKey: string }> }
) {
  const params = await paramsPromise;
  const user = await requireUser(request);
  if (user instanceof Response) return user;

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settingKey = params.settingKey;
  if (!Object.prototype.hasOwnProperty.call(SETTING_RULES, settingKey)) {
    return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawValue =
    typeof body === 'object' && body !== null && 'value' in body
      ? (body as { value: unknown }).value
      : undefined;

  if (rawValue === undefined) {
    return NextResponse.json({ error: 'Missing required field: value' }, { status: 400 });
  }

  const validation = validateValue(settingKey, rawValue);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // The settings store is not part of the generated Prisma schema, so the
  // validated change cannot be persisted yet. Refuse rather than report a
  // false success.
  return NextResponse.json(
    { error: 'Settings store is not configured' },
    { status: 503 }
  );
}