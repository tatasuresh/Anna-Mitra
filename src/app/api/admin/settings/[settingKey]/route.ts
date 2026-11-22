import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSettingKey, validateSettingValue, getAllSettings } from '@/lib/settings';

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
  if (!isSettingKey(settingKey)) {
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

  const validation = validateSettingValue(settingKey, rawValue);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: validation.value, updatedByUserId: user.id },
      create: { key: settingKey, value: validation.value, updatedByUserId: user.id },
    });
    const all = await getAllSettings();
    return NextResponse.json({ setting: all.find((x) => x.key === settingKey) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
