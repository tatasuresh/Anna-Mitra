'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PreferencesForm from '@/components/PreferencesForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ApiError, getMyRestaurants, getMyRestaurantPreferences } from '@/lib/api';
import type { Restaurant } from '@/types/restaurant';

type PreferencesInitial = ComponentProps<typeof PreferencesForm>['initial'];

export default function RestaurantPreferencesPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [preference, setPreference] = useState<PreferencesInitial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'donor') return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const restaurants = await getMyRestaurants();
        const mine: Restaurant | null = Array.isArray(restaurants) ? (restaurants[0] ?? null) : null;
        if (cancelled) return;
        setRestaurant(mine);
        if (mine) {
          const prefs = await getMyRestaurantPreferences(mine.id).catch(() => null);
          if (!cancelled) setPreference(prefs);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : 'Could not load your restaurant.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  if (userLoading || !user) {
    return <p className="p-6 text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-0">Loading…</p>;
  }

  if (user.role !== 'donor') {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6" data-nexen-id="nx-0f864d16-1">
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-2">
          Restaurant preferences are not available for your role.
        </p>
      </main>
    );
  }

  return (
    <main data-nexen-component="nx_app_restaurant_preferences_page" className="mx-auto w-full max-w-2xl min-w-0 space-y-6 p-4 sm:p-6" data-nexen-id="nx-0f864d16-3">
      <header className="space-y-1" data-nexen-id="nx-0f864d16-4">
        <h1 className="text-2xl font-bold" data-nexen-id="nx-0f864d16-5">Restaurant preferences</h1>
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-6">
          Set your usual portions and pickup window. Handling checklists are never saved here; you complete them fresh for every donation.
        </p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-7">Loading preferences…</p>}

      {!isLoading && loadError && (
        <div className="rounded-[var(--radius)] border bg-card p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && !restaurant && (
        <div className="rounded-[var(--radius)] border bg-card p-4 text-sm">
          <p data-nexen-id="nx-0f864d16-8">You need a restaurant before you can save preferences.</p>
          <Link href="/donor-dashboard" className="mt-2 inline-block font-semibold text-primary" data-nexen-id="nx-0f864d16-9">
            Go to your dashboard
          </Link>
        </div>
      )}

      {!isLoading && restaurant && (
        <>
          <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-0f864d16-10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 className="min-w-0 truncate font-semibold" data-nexen-id="nx-0f864d16-11">{restaurant.name}</h2>
              <span className="text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-12">Status: {restaurant.status}</span>
            </div>
            {restaurant.status !== 'approved' && (
              <p className="mt-2 text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-13">
                Saved preferences are active only once your restaurant is approved.
              </p>
            )}
          </section>

          {!preference && (
            <p className="text-sm text-muted-foreground" data-nexen-id="nx-0f864d16-14">
              No pickup preferences saved yet. Fill in the form below to save your defaults.
            </p>
          )}

          <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-0f864d16-15">
            <PreferencesForm
              restaurantId={restaurant.id}
              initial={preference ?? ({} as PreferencesInitial)}
              onSaved={() => setReloadKey((k) => k + 1)}
            />
          </section>
        </>
      )}
    </main>
  );
}