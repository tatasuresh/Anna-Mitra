'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, updateAdminSetting } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type SettingRow = { key: string; value: Record<string, unknown> };

const TIMEOUT_KEY = 'reservation_timeout_minutes';
const KG_KEY = 'kg_per_portion';

function readField(rows: SettingRow[], key: string, field: string): string {
  const row = rows.find((r) => r.key === key);
  const raw = row?.value?.[field];
  return typeof raw === 'number' ? String(raw) : '';
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const isAdmin = user?.role === 'admin';

  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeout, setTimeoutValue] = useState('');
  const [kg, setKg] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    getSettings()
      .then((data) => {
        const list: SettingRow[] = Array.isArray(data) ? data : [];
        setRows(list);
        setTimeoutValue(readField(list, TIMEOUT_KEY, 'minutes'));
        setKg(readField(list, KG_KEY, 'kg'));
      })
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : 'Settings could not be loaded.')
      );
  }, [user]);

  async function save(event: FormEvent<HTMLFormElement>, key: string, field: string, raw: string, min: number, integer: boolean) {
    event.preventDefault();
    setMessage(null);
    setSaveError(null);
    const num = Number(raw);
    if (!raw.trim() || Number.isNaN(num) || num < min || (integer && !Number.isInteger(num))) {
      setSaveError(integer ? `Enter a whole number of at least ${min}.` : `Enter a number of at least ${min}.`);
      return;
    }
    setSavingKey(key);
    try {
      await updateAdminSetting(key, { value: { [field]: num } });
      setRows((prev) => {
        const others = prev.filter((r) => r.key !== key);
        return [...others, { key, value: { [field]: num } }];
      });
      setMessage('Setting saved.');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Setting could not be saved.');
    } finally {
      setSavingKey(null);
    }
  }

  const inputClass =
    'w-full max-w-xs rounded-[var(--radius)] border bg-background px-3 py-2 text-sm disabled:opacity-60';
  const cardClass = 'rounded-[var(--radius)] border bg-card p-4 shadow-sm min-w-0';

  return (
    <main data-nexen-component="nx_app_settings_page" className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6 bg-background text-foreground font-sans" data-nexen-id="nx-31a1988f-0">
      <header className="min-w-0" data-nexen-id="nx-31a1988f-1">
        <h1 className="text-xl font-bold" data-nexen-id="nx-31a1988f-2">Settings</h1>
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-31a1988f-3">
          {isAdmin
            ? 'Change the reservation timeout and impact assumption used across the app.'
            : 'These values are set by an administrator and shown here for reference.'}
        </p>
      </header>

      {loadError && <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-31a1988f-4">{loadError}</p>}
      {message && <p role="status" className="text-sm text-primary" data-nexen-id="nx-31a1988f-5">{message}</p>}
      {saveError && <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-31a1988f-6">{saveError}</p>}

      <section className={cardClass} data-nexen-id="nx-31a1988f-7">
        <h2 className="font-semibold" data-nexen-id="nx-31a1988f-8">Reservation timeout</h2>
        <p className="mb-3 text-sm text-muted-foreground" data-nexen-id="nx-31a1988f-9">
          How many minutes an NGO has to confirm a claim before the portions return to the donation.
        </p>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => save(e, TIMEOUT_KEY, 'minutes', timeout, 1, true)}
         data-nexen-id="nx-31a1988f-10">
          <label className="text-sm min-w-0" htmlFor="timeout" data-nexen-id="nx-31a1988f-11">Minutes</label>
          <input
            id="timeout"
            type="number"
            min={1}
            step={1}
            className={inputClass}
            value={timeout}
            disabled={!isAdmin}
            onChange={(e) => setTimeoutValue(e.target.value)}
           data-nexen-id="nx-31a1988f-12"/>
          {isAdmin && (
            <button
              type="submit"
              disabled={savingKey !== null}
              className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
             data-nexen-id="nx-31a1988f-13">
              {savingKey === TIMEOUT_KEY ? 'Saving…' : 'Save timeout'}
            </button>
          )}
        </form>
      </section>

      <section className={cardClass} data-nexen-id="nx-31a1988f-14">
        <h2 className="font-semibold" data-nexen-id="nx-31a1988f-15">Impact assumption</h2>
        <p className="mb-3 text-sm text-muted-foreground" data-nexen-id="nx-31a1988f-16">
          Estimated kilograms of food waste avoided per portion. This is an estimate, not a measured figure.
        </p>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(e) => save(e, KG_KEY, 'kg', kg, 0, false)}
         data-nexen-id="nx-31a1988f-17">
          <label className="text-sm min-w-0" htmlFor="kg" data-nexen-id="nx-31a1988f-18">kg per portion</label>
          <input
            id="kg"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={kg}
            disabled={!isAdmin}
            onChange={(e) => setKg(e.target.value)}
           data-nexen-id="nx-31a1988f-19"/>
          {isAdmin && (
            <button
              type="submit"
              disabled={savingKey !== null}
              className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
             data-nexen-id="nx-31a1988f-20">
              {savingKey === KG_KEY ? 'Saving…' : 'Save assumption'}
            </button>
          )}
        </form>
      </section>

      {rows.length === 0 && !loadError && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-31a1988f-21">No settings are configured yet.</p>
      )}
    </main>
  );
}