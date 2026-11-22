'use client';

import { useState } from 'react';
import type { PickupTask } from '@/types/pickuptask';
import { createMyPickupTaskCollect, createMyPickupTaskHandover } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  accepted: 'Accepted, ready to collect',
  collected: 'Collected, ready to hand over',
  handed_over: 'Handed over to NGO',
  failed: 'Failed',
};

const STATUS_CLASSES: Record<string, string> = {
  open: 'bg-secondary text-secondary-foreground',
  accepted: 'bg-accent text-accent-foreground',
  collected: 'bg-primary/10 text-primary',
  handed_over: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

interface PickupActionCardProps {
  task: PickupTask;
  onChanged?: () => void;
}

type PickupAction = (pickupTaskId: string, input: Record<string, unknown>) => Promise<PickupTask>;

export default function PickupActionCard({ task, onChanged }: PickupActionCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = String(task.status);
  const canCollect = status === 'accepted';
  const canHandover = status === 'collected';
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusClass = STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';

  async function runAction(action: PickupAction) {
    setBusy(true);
    setError(null);
    try {
      await action(task.id, {});
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-nexen-component="nx_components_PickupActionCard" className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground" data-nexen-id="nx-40fdd1c9-0">
            {task.portionCount} {task.portionCount === 1 ? 'portion' : 'portions'}
          </p>
          <p className="text-xs text-muted-foreground" data-nexen-id="nx-40fdd1c9-1">Pickup task {task.id}</p>
        </div>
        <span
          className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
         data-nexen-id="nx-40fdd1c9-2">
          {statusLabel}
        </span>
      </div>

      {status === 'failed' && task.failureReason ? (
        <p className="mt-3 break-words text-sm text-destructive" data-nexen-id="nx-40fdd1c9-3">{task.failureReason}</p>
      ) : null}

      {canCollect || canHandover ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {canCollect ? (
            <button
              type="button"
              onClick={() => runAction(createMyPickupTaskCollect)}
              disabled={busy}
              className="w-full rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
             data-nexen-id="nx-40fdd1c9-4">
              {busy ? 'Saving...' : 'Confirm collected'}
            </button>
          ) : null}
          {canHandover ? (
            <button
              type="button"
              onClick={() => runAction(createMyPickupTaskHandover)}
              disabled={busy}
              className="w-full rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
             data-nexen-id="nx-40fdd1c9-5">
              {busy ? 'Saving...' : 'Confirm handed over'}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 break-words text-sm text-destructive" data-nexen-id="nx-40fdd1c9-6">
          {error}
        </p>
      ) : null}
    </div>
  );
}