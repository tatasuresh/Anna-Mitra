'use client';

import { useEffect, useState } from 'react';

type AvailabilityToggleProps = {
  isAvailable?: boolean;
  onSave?: (isAvailable: boolean) => Promise<void> | void;
  disabled?: boolean;
};

export default function AvailabilityToggle({
  isAvailable = false,
  onSave,
  disabled = false,
}: AvailabilityToggleProps) {
  const [savedValue, setSavedValue] = useState<boolean>(Boolean(isAvailable));
  const [checked, setChecked] = useState<boolean>(Boolean(isAvailable));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedValue(Boolean(isAvailable));
    setChecked(Boolean(isAvailable));
  }, [isAvailable]);

  const isDirty = checked !== savedValue;
  const statusWord = savedValue ? 'Available' : 'Not available';

  async function handleSave() {
    if (!onSave || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave(checked);
      setSavedValue(checked);
    } catch {
      setErrorMessage('Could not save availability. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div data-nexen-component="nx_components_AvailabilityToggle" className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="min-w-0 text-base font-semibold text-foreground" data-nexen-id="nx-db8817c6-0">Availability</h3>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            savedValue
              ? 'bg-[color:var(--success)]/10 text-[color:var(--success)]'
              : 'bg-muted text-muted-foreground'
          }`}
         data-nexen-id="nx-db8817c6-1">
          {statusWord}
        </span>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
       data-nexen-id="nx-db8817c6-2">
        <label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm text-foreground" data-nexen-id="nx-db8817c6-3">
          <input
            type="checkbox"
            role="switch"
            aria-checked={checked}
            checked={checked}
            disabled={disabled || isSaving}
            onChange={(event) => setChecked(event.target.checked)}
            className="h-5 w-5 shrink-0 cursor-pointer accent-[color:var(--primary)] disabled:cursor-not-allowed"
           data-nexen-id="nx-db8817c6-4"/>
          <span className="min-w-0 break-words" data-nexen-id="nx-db8817c6-5">Available for pickups</span>
        </label>

        <p className="text-sm text-muted-foreground" data-nexen-id="nx-db8817c6-6">
          Currently: {statusWord}
        </p>

        {errorMessage ? (
          <p role="alert" className="text-sm text-[color:var(--danger)]" data-nexen-id="nx-db8817c6-7">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={disabled || isSaving || !isDirty || !onSave}
            className="inline-flex w-full items-center justify-center rounded-[var(--radius)] border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
           data-nexen-id="nx-db8817c6-8">
            {isSaving ? 'Saving...' : 'Save availability'}
          </button>
        </div>
      </form>
    </div>
  );
}