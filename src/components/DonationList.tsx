'use client';

import Link from 'next/link';
import type { Donation } from '@/types/donation';

export interface DonationListProps {
  donations?: Donation[] | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  claimed: 'Claimed',
  partially_claimed: 'Partly claimed',
  in_transit: 'In transit',
  received: 'Received',
  expired: 'Expired',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-primary/10 text-primary',
  claimed: 'bg-accent/20 text-foreground',
  partially_claimed: 'bg-accent/20 text-foreground',
  in_transit: 'bg-primary/10 text-primary',
  received: 'bg-muted text-foreground',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatWhen(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMATTER.format(date);
}

const LINK_BUTTON =
  'inline-flex items-center rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted';

export default function DonationList({
  donations,
  isLoading = false,
  error = null,
  onRetry,
}: DonationListProps) {
  const rows = Array.isArray(donations) ? donations : [];

  if (isLoading) {
    return (
      <ul
        aria-busy="true"
        className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card"
       data-nexen-id="nx-0d4b4f72-0">
        {[0, 1, 2].map((i) => (
          <li key={i} className="p-4" data-nexen-id="nx-0d4b4f72-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-[var(--radius)] border border-destructive/30 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="min-w-0 text-sm text-destructive" data-nexen-id="nx-0d4b4f72-2">
          Donations could not be loaded.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
           data-nexen-id="nx-0d4b4f72-3">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm">
        <p className="font-semibold text-foreground" data-nexen-id="nx-0d4b4f72-4">No donations yet</p>
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-0d4b4f72-5">
          Post your first surplus food and its status will appear here.
        </p>
        <Link
          href="/quick-post"
          className="inline-flex items-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
         data-nexen-id="nx-0d4b4f72-6">
          New post
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-sm" data-nexen-id="nx-0d4b4f72-7">
      {rows.map((donation) => {
        const status = donation.status ?? '';
        const label = STATUS_LABELS[status] ?? status;
        const statusClass = STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';
        const href = `/donations/${donation.id}`;

        return (
          <li data-nexen-component="nx_components_DonationList"
            key={donation.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
           data-nexen-id="nx-0d4b4f72-8">
            <div className="min-w-0 flex-1">
              <Link
                href={href}
                className="block break-words font-semibold text-foreground hover:underline"
               data-nexen-id="nx-0d4b4f72-9">
                {donation.description}
              </Link>
              <p className="text-sm text-muted-foreground" data-nexen-id="nx-0d4b4f72-10">
                {donation.portionsTotal} portions
                {donation.pickupByAt
                  ? ` · Pickup by ${formatWhen(donation.pickupByAt)}`
                  : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
               data-nexen-id="nx-0d4b4f72-11">
                {label}
              </span>
              <Link href={href} className={LINK_BUTTON} data-nexen-id="nx-0d4b4f72-12">
                Open
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}