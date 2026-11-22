import { prisma } from '@/lib/db';

export type SettingKey = 'reservation_timeout_minutes' | 'kg_per_portion';

export type SettingDefinition = {
  key: SettingKey;
  defaultValue: number;
  description: string;
  min: number;
  max: number;
  integer: boolean;
  message: string;
};

/** Every setting the app understands. The database only stores overrides of these defaults. */
export const SETTING_DEFINITIONS: Record<SettingKey, SettingDefinition> = {
  reservation_timeout_minutes: {
    key: 'reservation_timeout_minutes',
    defaultValue: 5,
    description: 'Minutes an NGO claim stays reserved before it must be confirmed.',
    min: 1,
    max: 60,
    integer: true,
    message: 'Reservation timeout must be a whole number of minutes between 1 and 60.',
  },
  kg_per_portion: {
    key: 'kg_per_portion',
    defaultValue: 0.35,
    description: 'Impact assumption: estimated kilograms of food per confirmed portion.',
    min: 0.01,
    max: 10,
    integer: false,
    message: 'Kilograms per portion must be a number between 0.01 and 10.',
  },
};

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTING_DEFINITIONS, key);
}

export function validateSettingValue(
  key: SettingKey,
  value: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
  const def = SETTING_DEFINITIONS[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, error: def.message };
  if (def.integer && !Number.isInteger(value)) return { ok: false, error: def.message };
  if (value < def.min || value > def.max) return { ok: false, error: def.message };
  return { ok: true, value };
}

/** Current value of one setting: the stored override, else the default. */
export async function getSettingValue(key: SettingKey): Promise<number> {
  const def = SETTING_DEFINITIONS[key];
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row ? row.value : def.defaultValue;
  } catch {
    // Settings must never take the app down; fall back to the default.
    return def.defaultValue;
  }
}

/** All settings with their current values. */
export async function getAllSettings(): Promise<Array<{ key: SettingKey; value: number; description: string }>> {
  let rows: Array<{ key: string; value: number }> = [];
  try {
    rows = await prisma.setting.findMany();
  } catch {
    rows = [];
  }
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  return Object.values(SETTING_DEFINITIONS).map((def) => ({
    key: def.key,
    value: stored.get(def.key) ?? def.defaultValue,
    description: def.description,
  }));
}
