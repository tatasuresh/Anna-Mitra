const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export type CampaignRecognitionCardProps = {
  name: string;
  recognitionText?: string | null;
  startsOn: string;
  endsOn: string;
  isActive?: boolean;
};

export default function CampaignRecognitionCard({
  name,
  recognitionText,
  startsOn,
  endsOn,
  isActive = false,
}: CampaignRecognitionCardProps) {
  const displayName = typeof name === 'string' && name.trim() !== '' ? name : 'Untitled campaign';
  const text =
    typeof recognitionText === 'string' && recognitionText.trim() !== ''
      ? recognitionText
      : 'No recognition text has been added for this campaign yet.';

  return (
    <article data-nexen-component="nx_components_CampaignRecognitionCard" className="w-full min-w-0 max-w-xl rounded-[var(--radius)] border border-border bg-card p-6 text-foreground shadow-sm" data-nexen-id="nx-4f250989-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary" data-nexen-id="nx-4f250989-1">
            Campaign recognition
          </p>
          <h3 className="mt-1 break-words text-lg font-bold text-foreground" data-nexen-id="nx-4f250989-2">{displayName}</h3>
        </div>
        {isActive ? (
          <span className="inline-block self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary" data-nexen-id="nx-4f250989-3">
            Active
          </span>
        ) : null}
      </div>

      <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground" data-nexen-id="nx-4f250989-4">{text}</p>

      <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:gap-8" data-nexen-id="nx-4f250989-5">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground" data-nexen-id="nx-4f250989-6">Starts</dt>
          <dd className="font-semibold text-foreground" data-nexen-id="nx-4f250989-7">{formatDate(startsOn)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground" data-nexen-id="nx-4f250989-8">Ends</dt>
          <dd className="font-semibold text-foreground" data-nexen-id="nx-4f250989-9">{formatDate(endsOn)}</dd>
        </div>
      </dl>
    </article>
  );
}