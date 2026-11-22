'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, createMyDonationClaimConfirmReceipt } from '@/lib/api';

interface ReceiptFormProps {
  claimId: string;
  portionsClaimed: number;
  onConfirmed?: () => void;
}

function parseQuantity(raw: string, max: number): { value: number | null; error: string | null } {
  if (raw.trim() === '') {
    return { value: null, error: 'Enter the number of portions you received.' };
  }
  const n = Number(raw);
  if (!/^\d+$/.test(raw.trim()) || !Number.isInteger(n) || n < 0 || n > max) {
    return {
      value: null,
      error: 'Enter a whole number of portions from 0 to the claimed amount.',
    };
  }
  return { value: n, error: null };
}

export default function ReceiptForm({ claimId, portionsClaimed, onConfirmed }: ReceiptFormProps) {
  const claimed = Number.isFinite(portionsClaimed) && portionsClaimed > 0 ? Math.floor(portionsClaimed) : 0;

  const [quantity, setQuantity] = useState<string>(String(claimed));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (claimed === 0) {
    return (
      <div className="rounded-[var(--radius)] border bg-card p-4 text-sm text-muted-foreground">
        No claimed portions to confirm.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius)] border bg-card p-4">
        <p className="text-sm font-semibold text-foreground" data-nexen-id="nx-f0fe2a3c-0">Received quantity confirmed.</p>
        <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-f0fe2a3c-1">
          Only the confirmed portions count as rescued food.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = parseQuantity(quantity, claimed);
    if (parsed.error !== null || parsed.value === null) {
      setError(parsed.error);
      return;
    }

    setSubmitting(true);
    try {
      await createMyDonationClaimConfirmReceipt(claimId, { confirmed_portions: parsed.value });
      setDone(true);
      onConfirmed?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not confirm receipt. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form data-nexen-component="nx_components_ReceiptForm" onSubmit={handleSubmit} className="w-full max-w-xl space-y-6" noValidate data-nexen-id="nx-f0fe2a3c-2">
      <div className="rounded-[var(--radius)] border bg-card p-4">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm" data-nexen-id="nx-f0fe2a3c-3">
            <span className="font-medium text-foreground" data-nexen-id="nx-f0fe2a3c-4">Portions received</span>
            <input
              type="number"
              name="received_portions"
              inputMode="numeric"
              min={0}
              max={claimed}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={submitting}
              className="w-full rounded-[var(--radius)] border bg-background px-3 py-2 text-sm text-foreground"
             data-nexen-id="nx-f0fe2a3c-5"/>
            <span className="text-xs text-muted-foreground" data-nexen-id="nx-f0fe2a3c-6">
              Cannot exceed the {claimed} portions you claimed. Enter fewer if less arrived.
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm" data-nexen-id="nx-f0fe2a3c-7">
            <span className="font-medium text-foreground" data-nexen-id="nx-f0fe2a3c-8">Note (optional)</span>
            <textarea
              name="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder="Anything the donor should know"
              className="w-full rounded-[var(--radius)] border bg-background px-3 py-2 text-sm text-foreground"
             data-nexen-id="nx-f0fe2a3c-9"/>
          </label>
        </div>
      </div>

      {error !== null && (
        <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-f0fe2a3c-10">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
         data-nexen-id="nx-f0fe2a3c-11">
          {submitting ? 'Confirming…' : 'Confirm received'}
        </button>
        <p className="text-xs text-muted-foreground" data-nexen-id="nx-f0fe2a3c-12">
          Confirmation is final. Only the confirmed quantity counts as rescued food.
        </p>
      </div>
    </form>
  );
}