'use client';

import { useEffect, useState } from 'react';
import { getImpactDashboard } from '@/lib/api';

interface ImpactAssumptions {
  kg_per_portion?: number;
  currency?: string;
}

interface ImpactTotals {
  confirmed_portions_delivered?: number;
  estimated_waste_avoided_kg?: number;
  illustrative_cost?: number;
  currency?: string;
  assumptions?: ImpactAssumptions;
}

const DEFAULT_KG_PER_PORTION = 0.35;

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export default function ImpactDashboard() {
  const [data, setData] = useState<ImpactTotals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result: unknown = await getImpactDashboard();
        if (!cancelled) setData((result ?? {}) as ImpactTotals);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load impact figures');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground" data-nexen-id="nx-7c514b3f-0">Loading impact figures…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive" data-nexen-id="nx-7c514b3f-1">{error}</p>;
  }

  const portions = Math.max(0, Number(data?.confirmed_portions_delivered ?? 0));
  const kgPerPortion = Number(
    data?.assumptions?.kg_per_portion ?? DEFAULT_KG_PER_PORTION,
  );
  const wasteKg = Number(
    data?.estimated_waste_avoided_kg ?? portions * kgPerPortion,
  );
  const illustrativeCost = Number(data?.illustrative_cost ?? 0);
  const isEmpty = portions === 0;

  const cards = [
    {
      key: 'portions',
      label: 'Confirmed portions delivered',
      value: formatNumber(portions),
      badge: 'Confirmed at handover',
      note: 'Counted only when the receiving NGO confirms the quantity.',
      badgeClass: 'bg-primary/10 text-primary',
    },
    {
      key: 'waste',
      label: 'Estimated waste avoided',
      value: `${formatNumber(wasteKg, 1)} kg`,
      badge: 'Estimate',
      note: `Assumption: ${kgPerPortion} kg per confirmed portion.`,
      badgeClass: 'bg-secondary text-secondary-foreground',
    },
    {
      key: 'cost',
      label: 'Illustrative cost savings',
      value: `₹ ${formatNumber(illustrativeCost)}`,
      badge: 'Illustrative only',
      note: 'Demonstration rate on confirmed portions. Not an actual cost, payment or billing figure.',
      badgeClass: 'bg-secondary text-secondary-foreground',
    },
  ];

  return (
    <section data-nexen-component="nx_components_ImpactDashboard" className="w-full min-w-0 space-y-6" data-nexen-id="nx-7c514b3f-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary" data-nexen-id="nx-7c514b3f-3">
          Transparent impact
        </p>
        <h2 className="mt-1 text-2xl font-bold text-foreground" data-nexen-id="nx-7c514b3f-4">Confirmed impact</h2>
        <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-7c514b3f-5">
          Figures count only portions an NGO has confirmed as received. Estimates are labelled.
        </p>
      </div>

      {isEmpty && (
        <div className="rounded-[var(--radius)] border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          No confirmed rescues yet. Figures stay at zero until an NGO confirms received portions;
          no projected or placeholder numbers are shown.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <span className="min-w-0 text-sm text-muted-foreground" data-nexen-id="nx-7c514b3f-6">{card.label}</span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.badgeClass}`}
               data-nexen-id="nx-7c514b3f-7">
                {card.badge}
              </span>
            </div>
            <p className="mt-3 break-words text-3xl font-extrabold tracking-tight text-foreground" data-nexen-id="nx-7c514b3f-8">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground" data-nexen-id="nx-7c514b3f-9">{card.note}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground" data-nexen-id="nx-7c514b3f-10">
        Expired or unconfirmed reservations are excluded from every figure above. This sponsor view
        is read-only. All people, organisations, addresses and figures are synthetic hackathon data.
      </p>
    </section>
  );
}