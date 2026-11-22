'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, createDonationClaim } from '@/lib/api';

interface ClaimFormProps {
  donationId: string;
  portionsAvailable: number;
  maxPerClaim: number;
  onClaimed?: () => void;
}

export default function ClaimForm(props: ClaimFormProps) {
  const { donationId, onClaimed } = props;
  const available = Number.isFinite(props.portionsAvailable) ? props.portionsAvailable : 0;
  const maxPerClaim = Number.isFinite(props.maxPerClaim) ? props.maxPerClaim : 0;
  const limit = Math.max(0, Math.min(available, maxPerClaim));

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(raw: string): string | null {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return 'Enter how many portions you want to claim.';
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 1 || n > limit) {
      return `Enter a whole number between 1 and the portions still available for this donation (maximum per claim for your NGO: ${maxPerClaim}).`;
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = validate(value);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createDonationClaim(donationId, { portions_claimed: Number(value.trim()) });
      setDone(true);
      onClaimed?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not submit your claim. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const errorId = 'claim-quantity-error';
  const helpId = 'claim-quantity-help';
  const canSubmit = !submitting && !done && limit >= 1;

  return (
    <form data-nexen-component="nx_components_ClaimForm"
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm"
     data-nexen-id="nx-3da19f24-0">
      <label htmlFor="claim-quantity" className="block text-sm font-semibold text-foreground" data-nexen-id="nx-3da19f24-1">
        Portions to claim
      </label>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id="claim-quantity"
          name="portionsClaimed"
          type="number"
          inputMode="numeric"
          min={1}
          max={limit}
          step={1}
          value={value}
          disabled={submitting || done}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          className="w-full min-w-0 rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:flex-1"
         data-nexen-id="nx-3da19f24-2"/>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
         data-nexen-id="nx-3da19f24-3">
          {submitting ? 'Claiming…' : 'Claim portions'}
        </button>
      </div>

      <p id={helpId} className="mt-2 text-xs text-muted-foreground" data-nexen-id="nx-3da19f24-4">
        {limit >= 1
          ? `You can claim up to ${limit} portions (${available} available, ${maxPerClaim} max per claim).`
          : 'No portions can be claimed for this donation right now.'}
      </p>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive" data-nexen-id="nx-3da19f24-5">
          {error}
        </p>
      )}

      {done && (
        <p role="status" className="mt-2 text-sm font-medium text-primary" data-nexen-id="nx-3da19f24-6">
          Claim submitted. Reserved for you until the confirmation window closes.
        </p>
      )}
    </form>
  );
}