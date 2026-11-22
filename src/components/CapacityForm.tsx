'use client';

import { useState, type FormEvent } from 'react';
import { createMyNgoCapacity, updateMyNgoCapacity, ApiError } from '@/lib/api';

export interface CapacityValues {
  currentNeedPortions: number;
  capacityPortions: number;
  maxPortionsPerClaim: number;
  hasColdStorage: boolean;
  isAvailable: boolean;
}

interface CapacityFormProps {
  capacity?: CapacityValues | null;
  maxPortions?: number;
  onSaved?: () => void;
}

const DEFAULT_MAX_PORTIONS = 1000;
const PORTIONS_ERROR = 'Enter a whole number of portions between 0 and the allowed maximum.';
const AVAILABILITY_ERROR = 'Choose whether the NGO is accepting donations or paused.';

type Availability = 'accepting' | 'paused';

export default function CapacityForm({
  capacity = null,
  maxPortions = DEFAULT_MAX_PORTIONS,
  onSaved,
}: CapacityFormProps) {
  const [exists, setExists] = useState(capacity !== null);
  const [need, setNeed] = useState(String(capacity?.currentNeedPortions ?? 0));
  const [capacityText, setCapacityText] = useState(String(capacity?.capacityPortions ?? 0));
  const [maxClaim, setMaxClaim] = useState(String(capacity?.maxPortionsPerClaim ?? 0));
  const [cold, setCold] = useState(capacity?.hasColdStorage ?? false);
  const [availability, setAvailability] = useState<Availability>(
    capacity?.isAvailable === false ? 'paused' : 'accepting',
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseWhole = (raw: string): number | null => {
    const trimmed = raw.trim();
    const n = Number(trimmed);
    return trimmed !== '' && Number.isInteger(n) && n >= 0 && n <= maxPortions ? n : null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(false);

    const needN = parseWhole(need);
    const capN = parseWhole(capacityText);
    const maxN = parseWhole(maxClaim);
    if (needN === null || capN === null || maxN === null) {
      setError(PORTIONS_ERROR);
      return;
    }
    if (maxN > capN) {
      setError('Max portions per claim cannot exceed carrying capacity.');
      return;
    }
    if (availability !== 'accepting' && availability !== 'paused') {
      setError(AVAILABILITY_ERROR);
      return;
    }

    const payload = {
      currentNeedPortions: needN,
      capacityPortions: capN,
      maxPortionsPerClaim: maxN,
      hasColdStorage: cold,
      isAvailable: availability === 'accepting',
    };

    setSaving(true);
    setError(null);
    try {
      if (exists) {
        await updateMyNgoCapacity(payload);
      } else {
        await createMyNgoCapacity(payload);
        setExists(true);
      }
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save capacity. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-xl rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6"
     data-nexen-id="nx-c5f5bb76-0">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium text-foreground" data-nexen-id="nx-c5f5bb76-1">
          Current need (portions)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxPortions}
            step={1}
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            className={inputClass}
           data-nexen-id="nx-c5f5bb76-2"/>
        </label>

        <label className="block min-w-0 text-sm font-medium text-foreground" data-nexen-id="nx-c5f5bb76-3">
          Carrying capacity (portions)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxPortions}
            step={1}
            value={capacityText}
            onChange={(e) => setCapacityText(e.target.value)}
            className={inputClass}
           data-nexen-id="nx-c5f5bb76-4"/>
        </label>

        <label className="block min-w-0 text-sm font-medium text-foreground" data-nexen-id="nx-c5f5bb76-5">
          Max portions per claim
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={maxPortions}
            step={1}
            value={maxClaim}
            onChange={(e) => setMaxClaim(e.target.value)}
            className={inputClass}
           data-nexen-id="nx-c5f5bb76-6"/>
        </label>

        <label className="flex min-w-0 items-center gap-3 self-end text-sm font-medium text-foreground" data-nexen-id="nx-c5f5bb76-7">
          <input
            type="checkbox"
            checked={cold}
            onChange={(e) => setCold(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
           data-nexen-id="nx-c5f5bb76-8"/>
          Cold storage available
        </label>
      </div>

      <fieldset className="mt-5 min-w-0" data-nexen-id="nx-c5f5bb76-9">
        <legend className="text-sm font-medium text-foreground" data-nexen-id="nx-c5f5bb76-10">Availability</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['accepting', 'paused'] as const).map((option) => {
            const active = availability === option;
            return (
              <label data-nexen-component="nx_components_CapacityForm"
                key={option}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold capitalize ${
                  active
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground'
                }`}
               data-nexen-id="nx-c5f5bb76-11">
                <input
                  type="radio"
                  name="availability"
                  value={option}
                  checked={active}
                  onChange={() => setAvailability(option)}
                  className="sr-only"
                 data-nexen-id="nx-c5f5bb76-12"/>
                {option}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive" data-nexen-id="nx-c5f5bb76-13">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="mt-4 text-sm text-success" data-nexen-id="nx-c5f5bb76-14">
          Capacity saved.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
         data-nexen-id="nx-c5f5bb76-15">
          {saving ? 'Saving…' : exists ? 'Save capacity' : 'Create capacity'}
        </button>
      </div>
    </form>
  );
}