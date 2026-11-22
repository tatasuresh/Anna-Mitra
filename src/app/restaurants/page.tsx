'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getAdminRestaurants,
  getMyRestaurants,
  getRestaurants,
} from '@/lib/api';
import type { Restaurant } from '@/types/restaurant';

const STATUS_LABEL: Record<string, string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  suspended: 'Suspended',
};

export default function RestaurantsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const role = user?.role ?? '';

  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!role || role === 'csr_sponsor') return;
    setIsLoading(true);
    setError(null);
    try {
      let data: Restaurant[];
      if (role === 'donor') {
        data = await getMyRestaurants();
      } else if (role === 'admin') {
        data = await getAdminRestaurants();
      } else {
        data = await getRestaurants();
      }
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restaurants could not be loaded.');
      setRestaurants(null);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (isAuthenticated && role) {
      void load();
    }
  }, [isAuthenticated, role, load]);

  const visible = useMemo(() => {
    const list = Array.isArray(restaurants) ? restaurants : [];
    const needle = query.trim().toLowerCase();
    return list.filter((r) => {
      const matchesName = needle === '' || r.name.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === 'all' || String(r.status) === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [restaurants, query, statusFilter]);

  if (authLoading) {
    return <p className="px-4 py-8 text-sm text-muted-foreground" data-nexen-id="nx-484c5ef2-0">Loading…</p>;
  }

  if (role === 'csr_sponsor') {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8" data-nexen-id="nx-484c5ef2-1">
        <div className="rounded-[var(--radius)] border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold" data-nexen-id="nx-484c5ef2-2">Restaurants</h1>
          <p className="mt-2 text-sm text-muted-foreground" data-nexen-id="nx-484c5ef2-3">
            This directory is not available for your role.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 px-4 py-8" data-nexen-id="nx-484c5ef2-4">
      <header className="mb-6" data-nexen-id="nx-484c5ef2-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-484c5ef2-6">
          Directory
        </p>
        <h1 className="mt-1 text-2xl font-bold" data-nexen-id="nx-484c5ef2-7">Restaurants</h1>
        <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-484c5ef2-8">
          Restaurants that post surplus food, with their name and pickup location.
        </p>
      </header>

      <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          aria-label="Search restaurants by name"
          className="w-full min-w-0 flex-1 rounded-[var(--radius)] border bg-card px-3 py-2 text-sm"
         data-nexen-id="nx-484c5ef2-9"/>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="w-full rounded-[var(--radius)] border bg-card px-3 py-2 text-sm sm:w-auto"
         data-nexen-id="nx-484c5ef2-10">
          <option value="all">All statuses</option>
          <option value="pending_approval">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-484c5ef2-11">Loading restaurants…</p>
      )}

      {error && !isLoading && (
        <div className="rounded-[var(--radius)] border bg-card p-4 shadow-sm">
          <p className="text-sm" data-nexen-id="nx-484c5ef2-12">Restaurants could not be loaded.</p>
          <p className="mt-1 text-xs text-muted-foreground" data-nexen-id="nx-484c5ef2-13">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-[var(--radius)] border px-3 py-2 text-sm font-medium"
           data-nexen-id="nx-484c5ef2-14">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <div className="rounded-[var(--radius)] border bg-card p-6 text-center shadow-sm">
          <p className="font-medium" data-nexen-id="nx-484c5ef2-15">No restaurants to show.</p>
          <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-484c5ef2-16">
            Try a different name or status filter.
          </p>
        </div>
      )}

      {!isLoading && !error && visible.length > 0 && (
        <ul className="flex flex-col gap-3" data-nexen-id="nx-484c5ef2-17">
          {visible.map((r) => {
            const status = String(r.status);
            const isApproved = status === 'approved';
            return (
              <li data-nexen-component="nx_app_restaurants_page"
                key={r.id}
                className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm"
               data-nexen-id="nx-484c5ef2-18">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold" data-nexen-id="nx-484c5ef2-19">{r.name}</h2>
                    <p className="text-xs text-muted-foreground" data-nexen-id="nx-484c5ef2-20">
                      {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}
                    </p>
                  </div>
                  <span className="inline-block w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold" data-nexen-id="nx-484c5ef2-21">
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
                {role === 'donor' && isApproved && (
                  <div className="mt-3">
                    <Link
                      href="/restaurant-preferences"
                      className="text-sm font-medium underline underline-offset-4"
                     data-nexen-id="nx-484c5ef2-22">
                      Pickup preferences
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}