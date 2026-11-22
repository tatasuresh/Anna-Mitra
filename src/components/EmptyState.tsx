
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface EmptyStateAction {
  label: string;
  href: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div data-nexen-component="nx_components_EmptyState"
      role="status"
      className={`flex w-full min-w-0 flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-border bg-card px-4 py-8 text-center shadow-sm sm:px-6 sm:py-12 ${className}`.trim()}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="break-words text-base font-semibold text-foreground" data-nexen-id="nx-d69f50f7-0">{title}</h3>
      {description ? (
        <p className="max-w-md break-words text-sm text-muted-foreground" data-nexen-id="nx-d69f50f7-1">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
         data-nexen-id="nx-d69f50f7-2">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}