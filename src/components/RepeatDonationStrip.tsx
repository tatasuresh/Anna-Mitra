
'use client';

import { useState } from 'react';
import type { Donation } from '@/types/donation';

type RepeatDonationStripProps = {
  previousDonation?: Donation | null;
  onRepeat: (donationId: string) => Promise<void> | void;
  isRepeating?: boolean;
};

function formatPickup(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export default function RepeatDonationStrip({
  previousDonation,
  onRepeat,
  isRepeating = false,
}: RepeatDonationStripProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!previousDonation) return null;

  const busy = isRepeating || submitting;

  async function handleRepeat() {
    if (!previousDonation || busy) return;
    setError(null);
    setSubmitting(true);
    try {
      await onRepeat(previousDonation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not repeat the last donation. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section data-nexen-component="nx_components_RepeatDonationStrip" className="w-full min-w-0" data-nexen-id="nx-7a6d9f60-0">
      <div className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card text-foreground shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="min-w-0 text-base font-semibold" data-nexen-id="nx-7a6d9f60-1">Repeat last donation</h3>
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" data-nexen-id="nx-7a6d9f60-2">
            One tap
          </span>
        </div>

        <div className="space-y-4 p-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6" data-nexen-id="nx-7a6d9f60-3">
            <dt className="font-medium text-muted-foreground" data-nexen-id="nx-7a6d9f60-4">Food</dt>
            <dd className="min-w-0 break-words" data-nexen-id="nx-7a6d9f60-5">{previousDonation.description}</dd>
            <dt className="font-medium text-muted-foreground" data-nexen-id="nx-7a6d9f60-6">Portions</dt>
            <dd data-nexen-id="nx-7a6d9f60-7">{previousDonation.portionsTotal}</dd>
            <dt className="font-medium text-muted-foreground" data-nexen-id="nx-7a6d9f60-8">Pickup by</dt>
            <dd data-nexen-id="nx-7a6d9f60-9">{formatPickup(previousDonation.pickupByAt)}</dd>
          </dl>

          <p className="text-xs text-muted-foreground" data-nexen-id="nx-7a6d9f60-10">
            Only the food details are copied. Handling answers and safety declarations are completed fresh.
          </p>

          {error ? (
            <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-7a6d9f60-11">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleRepeat}
            disabled={busy}
            className="inline-flex w-full items-center justify-center rounded-[var(--radius)] border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
           data-nexen-id="nx-7a6d9f60-12">
            {busy ? 'Repeating…' : 'Repeat last donation'}
          </button>
        </div>
      </div>
    </section>
  );
}