'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteMyNotification } from '@/lib/api';

export interface AlertItem {
  id: string;
  message: string;
  donationId?: string | null;
  createdAt?: string | null;
}

interface AlertsStripProps {
  alerts?: AlertItem[];
}

const stampFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatStamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return stampFormatter.format(date);
}

export default function AlertsStrip({ alerts: alertsProp }: AlertsStripProps) {
  const alerts = Array.isArray(alertsProp) ? alertsProp : [];
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = alerts.filter((alert) => !dismissed.includes(alert.id));

  async function dismiss(id: string) {
    setDismissed((prev) => [...prev, id]);
    try {
      await deleteMyNotification(id);
    } catch {
      setDismissed((prev) => prev.filter((value) => value !== id));
    }
  }

  return (
    <section aria-label="New matches" className="w-full min-w-0 space-y-3" data-nexen-id="nx-04599535-0">
      <h2 className="text-base font-semibold text-foreground" data-nexen-id="nx-04599535-1">New matches</h2>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-04599535-2">No new matches right now.</p>
      ) : (
        <div className="flex w-full gap-3 overflow-x-auto pb-1">
          {visible.map((alert) => {
            const stamp = formatStamp(alert.createdAt);
            return (
              <div data-nexen-component="nx_components_AlertsStrip"
                key={alert.id}
                role="status"
                className="flex w-72 max-w-full shrink-0 items-start gap-3 rounded-[var(--radius)] border border-l-4 border-border border-l-primary bg-card p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  {alert.donationId ? (
                    <Link
                      href={`/ngo-feed#donation-${alert.donationId}`}
                      className="block break-words text-sm font-medium text-foreground underline-offset-4 hover:underline"
                     data-nexen-id="nx-04599535-3">
                      {alert.message}
                    </Link>
                  ) : (
                    <p className="break-words text-sm font-medium text-foreground" data-nexen-id="nx-04599535-4">
                      {alert.message}
                    </p>
                  )}
                  {stamp ? (
                    <p className="text-xs text-muted-foreground" data-nexen-id="nx-04599535-5">{stamp}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(alert.id)}
                  aria-label="Dismiss alert"
                  className="shrink-0 rounded-[var(--radius)] px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                 data-nexen-id="nx-04599535-6">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}