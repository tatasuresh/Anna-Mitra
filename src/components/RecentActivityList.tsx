
import Link from 'next/link';
import type { Donation } from '@/types/donation';

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
  published: 'bg-primary/10 text-primary',
  claimed: 'bg-accent/20 text-foreground',
  partially_claimed: 'bg-accent/20 text-foreground',
  in_transit: 'bg-accent/20 text-foreground',
  received: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

// Fixed timezone keeps server and client output identical (no hydration mismatch).
const pickupFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatPickupBy(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pick up by time unavailable';
  return `Pick up by ${pickupFormatter.format(date)}`;
}

export default function RecentActivityList({
  donations,
}: {
  donations?: Donation[] | null;
}) {
  const rows = Array.isArray(donations) ? donations : [];

  return (
    <section className="flex min-w-0 flex-col gap-3" data-nexen-id="nx-5674a4c7-0">
      <h2 className="text-lg font-semibold text-foreground" data-nexen-id="nx-5674a4c7-1">Recent activity</h2>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-5674a4c7-2">
            No donations yet. Post your first surplus food to see it here.
          </p>
          <Link
            href="/quick-post"
            className="inline-flex items-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
           data-nexen-id="nx-5674a4c7-3">
            Post surplus food
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" data-nexen-id="nx-5674a4c7-4">
          {rows.map((donation) => {
            const label = STATUS_LABELS[donation.status] ?? donation.status;
            const badgeClass =
              STATUS_CLASSES[donation.status] ?? 'bg-muted text-muted-foreground';

            return (
              <li data-nexen-component="nx_components_RecentActivityList" key={donation.id} className="min-w-0" data-nexen-id="nx-5674a4c7-5">
                <Link
                  href={`/donations/${donation.id}`}
                  className="block min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow"
                 data-nexen-id="nx-5674a4c7-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <h3 className="min-w-0 break-words text-base font-semibold text-foreground" data-nexen-id="nx-5674a4c7-7">
                      {donation.description}
                    </h3>
                    <span
                      className={`inline-block w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                     data-nexen-id="nx-5674a4c7-8">
                      {label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-5674a4c7-9">
                    {donation.portionsTotal} portions · {formatPickupBy(donation.pickupByAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}