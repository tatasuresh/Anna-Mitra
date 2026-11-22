'use client';

export type DemoRole = 'donor' | 'ngo' | 'volunteer' | 'admin' | 'csr_sponsor';

export interface DemoRoleCardProps {
  role: DemoRole;
  label: string;
  description: string;
  isSelected?: boolean;
  isBusy?: boolean;
  onSelect: (role: DemoRole) => void;
  onEnterDemo: (role: DemoRole) => void;
}

export default function DemoRoleCard({
  role,
  label,
  description,
  isSelected = false,
  isBusy = false,
  onSelect,
  onEnterDemo,
}: DemoRoleCardProps) {
  const cardClass = isSelected
    ? 'border-primary ring-2 ring-primary/30'
    : 'border-border';

  return (
    <div data-nexen-component="nx_components_DemoRoleCard"
      data-role={role}
      className={`flex w-full min-w-0 flex-col gap-3 rounded-[var(--radius)] border bg-card p-5 shadow-sm ${cardClass}`}
    >
      <button
        type="button"
        onClick={() => onSelect(role)}
        aria-pressed={isSelected}
        className="flex min-w-0 flex-col gap-1 text-left"
       data-nexen-id="nx-185122d2-0">
        <h3 className="break-words text-base font-semibold text-foreground" data-nexen-id="nx-185122d2-1">
          {label}
        </h3>
        <p className="break-words text-sm text-muted-foreground" data-nexen-id="nx-185122d2-2">
          {description}
        </p>
      </button>

      {isSelected && (
        <button
          type="button"
          onClick={() => onEnterDemo(role)}
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
         data-nexen-id="nx-185122d2-3">
          {isBusy ? 'Entering demo…' : 'Enter demo'}
        </button>
      )}
    </div>
  );
}