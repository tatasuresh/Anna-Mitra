type StatusEventItem = {
  id: string;
  createdAt: string;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  actorUserId: string;
  sequenceNo?: number | null;
};

type StatusTimelineProps = {
  events?: StatusEventItem[] | null;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function StatusTimeline({ events }: StatusTimelineProps) {
  const safeEvents = Array.isArray(events) ? events : [];

  // Oldest first, most recent last. Copy before sorting so the prop is not mutated.
  const ordered = [...safeEvents].sort(
    (a, b) =>
      (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0) ||
      String(a.createdAt).localeCompare(String(b.createdAt)),
  );

  if (ordered.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-2659046c-0">No status changes yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Status timeline"
      className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6"
     data-nexen-id="nx-2659046c-1">
      <ol className="relative ml-2 space-y-6 border-l border-border pl-6" data-nexen-id="nx-2659046c-2">
        {ordered.map((event, index) => {
          const isLatest = index === ordered.length - 1;
          return (
            <li data-nexen-component="nx_components_StatusTimeline" key={event.id} className="relative min-w-0" data-nexen-id="nx-2659046c-3">
              <span
                aria-hidden="true"
                className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-card ${
                  isLatest ? 'bg-primary' : 'bg-muted-foreground'
                }`}
               data-nexen-id="nx-2659046c-4"/>
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {event.fromStatus ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground break-words" data-nexen-id="nx-2659046c-5">
                      {formatStatus(event.fromStatus)}
                    </span>
                  ) : null}
                  {event.fromStatus ? (
                    <span aria-hidden="true" className="text-xs text-muted-foreground" data-nexen-id="nx-2659046c-6">
                      →
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold break-words ${
                      isLatest
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-foreground'
                    }`}
                   data-nexen-id="nx-2659046c-7">
                    {formatStatus(event.toStatus)}
                  </span>
                </div>
                <time
                  dateTime={String(event.createdAt)}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {formatWhen(String(event.createdAt))}
                </time>
              </div>
              {event.reason ? (
                <p className="mt-1 text-sm text-muted-foreground break-words" data-nexen-id="nx-2659046c-8">{event.reason}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}