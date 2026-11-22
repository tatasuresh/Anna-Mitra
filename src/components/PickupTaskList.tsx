'use client';

import { useState } from 'react';
import { createPickupTaskAccept, ApiError } from '@/lib/api';
import type { PickupTask } from '@/types/pickuptask';

export type PickupTaskRow = PickupTask & {
  description?: string;
  donorName?: string;
  ngoName?: string;
  pickupByAt?: string;
};

interface PickupTaskListProps {
  tasks?: PickupTaskRow[];
  onAccepted?: (pickupTaskId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  accepted: 'Accepted',
  collected: 'Collected',
  handed_over: 'Handed over',
  failed: 'Failed',
};

const pickupFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

function formatPickupBy(value?: string): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return pickupFormatter.format(date);
}

export default function PickupTaskList(props: PickupTaskListProps) {
  const { tasks: tasksProp, onAccepted } = props;
  const tasks = Array.isArray(tasksProp) ? tasksProp : [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sorted = tasks
    .slice()
    .sort((a, b) => (a.pickupByAt ?? '').localeCompare(b.pickupByAt ?? ''));

  async function handleAccept(task: PickupTaskRow) {
    setBusyId(task.id);
    setErrorMessage(null);
    try {
      await createPickupTaskAccept(task.id, {});
      onAccepted?.(task.id);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : 'This pickup could not be accepted. Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (sorted.length === 0) {
    return (
      <p className="rounded-[var(--radius)] border bg-card p-6 text-center text-sm text-muted-foreground" data-nexen-id="nx-ddd08110-0">
        No pickups are waiting for a volunteer right now.
      </p>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-ddd08110-1">
          {errorMessage}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2" data-nexen-id="nx-ddd08110-2">
        {sorted.map((task) => {
          const isOpen = task.status === 'open' && !task.volunteerUserId;
          return (
            <li data-nexen-component="nx_components_PickupTaskList"
              key={task.id}
              className="flex min-w-0 flex-col gap-3 rounded-[var(--radius)] border bg-card p-4 shadow-sm"
             data-nexen-id="nx-ddd08110-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="min-w-0 break-words font-semibold" data-nexen-id="nx-ddd08110-4">
                  {task.description ?? 'Food pickup'}
                </h3>
                <span className="inline-block shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" data-nexen-id="nx-ddd08110-5">
                  {task.portionCount} portions
                </span>
              </div>

              <dl className="space-y-1 text-sm text-muted-foreground" data-nexen-id="nx-ddd08110-6">
                <div className="flex flex-wrap gap-1">
                  <dt data-nexen-id="nx-ddd08110-7">Donor:</dt>
                  <dd className="break-words text-foreground" data-nexen-id="nx-ddd08110-8">{task.donorName ?? 'Unknown donor'}</dd>
                </div>
                <div className="flex flex-wrap gap-1">
                  <dt data-nexen-id="nx-ddd08110-9">Receiving NGO:</dt>
                  <dd className="break-words text-foreground" data-nexen-id="nx-ddd08110-10">{task.ngoName ?? 'Unknown NGO'}</dd>
                </div>
                <div className="flex flex-wrap gap-1">
                  <dt data-nexen-id="nx-ddd08110-11">Pickup by:</dt>
                  <dd className="text-foreground" data-nexen-id="nx-ddd08110-12">{formatPickupBy(task.pickupByAt)}</dd>
                </div>
                <div className="flex flex-wrap gap-1">
                  <dt data-nexen-id="nx-ddd08110-13">Status:</dt>
                  <dd className="text-foreground" data-nexen-id="nx-ddd08110-14">{STATUS_LABELS[task.status] ?? task.status}</dd>
                </div>
              </dl>

              {isOpen && (
                <div className="mt-auto flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAccept(task)}
                    disabled={busyId !== null}
                    className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
                   data-nexen-id="nx-ddd08110-15">
                    {busyId === task.id ? 'Accepting…' : 'Accept pickup'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}