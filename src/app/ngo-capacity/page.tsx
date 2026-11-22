'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CapacityForm from '@/components/CapacityForm';
import { getMyNgoCapacity } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { NgoCapacity } from '@/types/ngocapacity';

const MAX_PORTIONS = 500;
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export default function NgoCapacityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [capacity, setCapacity] = useState<NgoCapacity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyNgoCapacity();
      setCapacity(data);
      const updated = new Date(data.updatedAt).getTime();
      setIsStale(Date.now() - updated > STALE_AFTER_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your capacity.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ngo') {
      setIsLoading(false);
      return;
    }
    void load();
  }, [user, authLoading, router, load]);

  if (authLoading || (user && user.role !== 'ngo' && isLoading)) {
    return <p className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-f2225ac7-0">Loading…</p>;
  }

  if (user && user.role !== 'ngo') {
    return (
      <main className="mx-auto w-full max-w-xl p-4" data-nexen-id="nx-f2225ac7-1">
        <p className="rounded-[var(--radius)] border bg-card p-4 text-sm text-muted-foreground" data-nexen-id="nx-f2225ac7-2">
          This page is not available for your role.
        </p>
      </main>
    );
  }

  return (
    <main data-nexen-component="nx_app_ngo_capacity_page" className="mx-auto w-full max-w-xl space-y-4 p-4 sm:p-6" data-nexen-id="nx-f2225ac7-3">
      <header className="min-w-0" data-nexen-id="nx-f2225ac7-4">
        <h1 className="text-2xl font-bold" data-nexen-id="nx-f2225ac7-5">Need and capacity</h1>
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-f2225ac7-6">
          Changes reshape your feed for future donations. Donations you have already claimed or reserved keep their allocations.
        </p>
      </header>

      {isStale && (
        <p className="rounded-[var(--radius)] border bg-card p-3 text-sm" data-nexen-id="nx-f2225ac7-7">
          Your need and capacity have not been updated in over a week. Please review them.
        </p>
      )}

      {error && (
        <div className="rounded-[var(--radius)] border bg-card p-4 text-sm">
          <p className="text-destructive" data-nexen-id="nx-f2225ac7-8">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 rounded-[var(--radius)] border px-3 py-1.5 text-sm"
           data-nexen-id="nx-f2225ac7-9">
            Try again
          </button>
        </div>
      )}

      {isLoading && !error && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-f2225ac7-10">Loading your capacity…</p>
      )}

      {!isLoading && !error && (
        <>
          {capacity && (
            <p className="text-xs text-muted-foreground" data-nexen-id="nx-f2225ac7-11">
              Last updated {new Date(capacity.updatedAt).toLocaleString()}
            </p>
          )}
          <section className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-f2225ac7-12">
            <CapacityForm
              capacity={capacity}
              maxPortions={MAX_PORTIONS}
              onSaved={() => void load()}
            />
          </section>
        </>
      )}
    </main>
  );
}