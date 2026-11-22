import Link from 'next/link';
import type { Donation } from '@/types/donation';

type DonationCardProps = {
  donation?: Donation | null;
  ngoName?: string | null;
};

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

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-primary/10 text-primary',
  claimed: 'bg-accent/20 text-accent-foreground',
  partially_claimed: 'bg-accent/20 text-accent-foreground',
  in_transit: 'bg-secondary text-secondary-foreground',
  received: 'bg-primary text-primary-foreground',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

// Fixed timezone keeps server and client output identical (no hydration drift).
const PICKUP_FORMAT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatPickupBy(value: string | Date | null | undefined): string {
  if (!value) return 'Pickup time not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pickup time not set';
  return PICKUP_FORMAT.format(date);
}

export default function DonationCard({ donation, ngoName }: DonationCardProps) {
  if (!donation) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 text-sm text-muted-foreground">
        No donation to show yet.
      </div>
    );
  }

  const status = String(donation.status ?? '');
  const statusLabel = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  const statusTone = STATUS_TONE[status] ?? 'bg-muted text-muted-foreground';

  const total = Math.max(0, Number(donation.portionsTotal ?? 0));
  const remaining = Math.min(total, Math.max(0, Number(donation.portionsRemaining ?? 0)));
  const claimed = Math.max(0, total - remaining);

  const portionsLine = `${remaining} of ${total} portions unclaimed`;
  const pickupLine = `Pick up by ${formatPickupBy(donation.pickupByAt)}`;

  return (
    <Link
      href={`/donations/${donation.id}`}
      className="block rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
     data-nexen-id="nx-968e0308-0">
      <div data-nexen-component="nx_components_DonationCard" className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h3 className="min-w-0 break-words text-base font-semibold text-foreground" data-nexen-id="nx-968e0308-1">
          {donation.description}
        </h3>
        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone}`}
         data-nexen-id="nx-968e0308-2">
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
        <p className="min-w-0 break-words" data-nexen-id="nx-968e0308-3">{portionsLine}</p>
        <p className="min-w-0 break-words" data-nexen-id="nx-968e0308-4">{pickupLine}</p>
        {ngoName && claimed > 0 ? (
          <p className="min-w-0 break-words" data-nexen-id="nx-968e0308-5">
            Claimed by {ngoName} · {claimed} {claimed === 1 ? 'portion' : 'portions'}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm font-semibold text-foreground" data-nexen-id="nx-968e0308-6">
          Open
        </span>
      </div>
    </Link>
  );
}