'use client';

import { useState, type FormEvent } from 'react';
import { updateRestaurantPreference } from '@/lib/api';

export type PreferencesInitial = {
  defaultPortions?: number | null;
  defaultPickupWindowMinutes?: number | null;
  pickupNotes?: string | null;
};

interface PreferencesFormProps {
  restaurantId: string;
  initial?: PreferencesInitial;
  onSaved?: () => void;
}

type FieldErrors = Partial<Record<'portions' | 'window' | 'notes', string>>;

const MAX_NOTES = 280;

function validate(portions: string, windowMinutes: string, notes: string): FieldErrors {
  const errors: FieldErrors = {};
  const p = Number(portions);
  if (!/^\d+$/.test(portions.trim()) || p < 1 || p > 200) {
    errors.portions = 'Enter a whole number of portions between 1 and 200.';
  }
  const w = Number(windowMinutes);
  if (!/^\d+$/.test(windowMinutes.trim()) || w < 15 || w > 240) {
    errors.window = 'Enter a pickup window between 15 and 240 minutes.';
  }
  if (notes.length > MAX_NOTES) {
    errors.notes = 'Pickup instructions must be 280 characters or fewer.';
  }
  return errors;
}

export default function PreferencesForm({ restaurantId, initial, onSaved }: PreferencesFormProps) {
  const [portions, setPortions] = useState(
    initial?.defaultPortions != null ? String(initial.defaultPortions) : '',
  );
  const [windowMinutes, setWindowMinutes] = useState(
    initial?.defaultPickupWindowMinutes != null ? String(initial.defaultPickupWindowMinutes) : '60',
  );
  const [notes, setNotes] = useState(initial?.pickupNotes ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const fieldErrors = validate(portions, windowMinutes, notes);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSaving(true);
    try {
      await updateRestaurantPreference(restaurantId, {
        defaultPortions: Number(portions),
        defaultPickupWindowMinutes: Number(windowMinutes),
        pickupNotes: notes.trim(),
      });
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save preferences. Try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'mt-1 w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
  const labelClass = 'block text-sm font-semibold text-foreground';
  const errorClass = 'mt-1 text-xs text-destructive';

  return (
    <form data-nexen-component="nx_components_PreferencesForm"
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-xl space-y-5 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6"
     data-nexen-id="nx-4e7a8ce0-0">
      <div>
        <label htmlFor="pref-portions" className={labelClass} data-nexen-id="nx-4e7a8ce0-1">
          Default portions
        </label>
        <input
          id="pref-portions"
          name="defaultPortions"
          type="text"
          inputMode="numeric"
          value={portions}
          onChange={(e) => setPortions(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.portions)}
          aria-describedby={errors.portions ? 'pref-portions-error' : undefined}
         data-nexen-id="nx-4e7a8ce0-2"/>
        {errors.portions && (
          <p id="pref-portions-error" className={errorClass} data-nexen-id="nx-4e7a8ce0-3">
            {errors.portions}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pref-window" className={labelClass} data-nexen-id="nx-4e7a8ce0-4">
          Preferred pickup window (minutes)
        </label>
        <input
          id="pref-window"
          name="defaultPickupWindowMinutes"
          type="text"
          inputMode="numeric"
          value={windowMinutes}
          onChange={(e) => setWindowMinutes(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.window)}
          aria-describedby={errors.window ? 'pref-window-error' : undefined}
         data-nexen-id="nx-4e7a8ce0-5"/>
        {errors.window && (
          <p id="pref-window-error" className={errorClass} data-nexen-id="nx-4e7a8ce0-6">
            {errors.window}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pref-notes" className={labelClass} data-nexen-id="nx-4e7a8ce0-7">
          Pickup notes (optional)
        </label>
        <textarea
          id="pref-notes"
          name="pickupNotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? 'pref-notes-error' : undefined}
         data-nexen-id="nx-4e7a8ce0-8"/>
        <div className="mt-1 flex items-start justify-between gap-2 text-xs text-muted-foreground">
          {errors.notes ? (
            <span id="pref-notes-error" className="text-destructive" data-nexen-id="nx-4e7a8ce0-9">
              {errors.notes}
            </span>
          ) : (
            <span  data-nexen-id="nx-4e7a8ce0-10"/>
          )}
          <span data-nexen-id="nx-4e7a8ce0-11">
            {notes.length}/{MAX_NOTES}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" data-nexen-id="nx-4e7a8ce0-12">
        Preferences save reusable defaults only. Each donation needs a fresh handling checklist.
      </p>

      {formError && (
        <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-4e7a8ce0-13">
          {formError}
        </p>
      )}
      {saved && !formError && (
        <p role="status" className="text-sm text-foreground" data-nexen-id="nx-4e7a8ce0-14">
          Preferences saved.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
         data-nexen-id="nx-4e7a8ce0-15">
          {isSaving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </form>
  );
}