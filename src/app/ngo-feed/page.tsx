'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AlertsStrip from '@/components/AlertsStrip';
import { getDonationEligible, getMyNgoCapacity, getRestaurants } from '@/lib/api';

function formatPickupBy(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NgoFeedPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDonationEligible>> | null>(null);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [capacity, setCapacity] = useState<Awaited<ReturnType<typeof getMyNgoCapacity>> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eligible, restaurants, ngoCapacity] = await Promise.all([
        getDonationEligible(),
        getRestaurants(),
        getMyNgoCapacity().catch(() => null),
      ]);
      const names: Record<string, string> = {};
      for (const restaurant of Array.isArray(restaurants) ? restaurants : []) {
        names[restaurant.id] = restaurant.name;
      }
      setData(eligible);
      setRestaurantNames(names);
      setCapacity(ngoCapacity);
    } catch {
      setError('Donations could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rawList = data && Array.isArray(data.donations) ? data.donations : [];
  const list = [...rawList].sort(
    (a, b) =>
      new Date(a.donation.pickupByAt).getTime() - new Date(b.donation.pickupByAt).getTime() ||
      a.distance_km - b.distance_km,
  );
  const rawAlerts = data && Array.isArray(data.alerts) ? data.alerts : [];
  const alerts = rawAlerts.map((alert, index) => ({
    id: `${alert.donation_id}-${index}`,
    ...alert,
  }));

  const needLine = capacity
    ? `Need ${capacity.currentNeedPortions} portions · capacity ${capacity.capacityPortions} portions.`
    : 'Set your need and capacity to see tailored matches.';

  return (
    <div data-nexen-component="nx_app_ngo_feed_page" className="ui-page">
      <div className="ui-page-header">
        <div className="min-w-0">
          <h1 data-nexen-id="nx-75b5088a-0">Nearby donations</h1>
          <p className="ui-meta" data-nexen-id="nx-75b5088a-1">
            Eligible surplus donations matched to your need and capacity. {needLine}
          </p>
        </div>
        <div className="ui-actions">
          <Link className="ui-btn ui-btn-secondary" href="/ngo-capacity" data-nexen-id="nx-75b5088a-2">
            Update need and capacity
          </Link>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-75b5088a-3">
        <AlertsStrip alerts={alerts} />
      </section>

      <section className="ui-section" data-nexen-id="nx-75b5088a-4">
        <h2 className="ui-section-title" data-nexen-id="nx-75b5088a-5">Available to claim</h2>

        {isLoading && (
          <div className="ui-grid ui-grid-2 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="ui-card h-40" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="ui-alert ui-alert-danger flex flex-wrap items-center justify-between gap-3">
            <span data-nexen-id="nx-75b5088a-6">{error}</span>
            <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={load} data-nexen-id="nx-75b5088a-7">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && list.length === 0 && (
          <div className="ui-card">
            <p className="font-semibold" data-nexen-id="nx-75b5088a-8">No eligible nearby donations yet</p>
            <p className="ui-meta" data-nexen-id="nx-75b5088a-9">None match your need and capacity right now. Check back soon.</p>
          </div>
        )}

        {!isLoading && !error && list.length > 0 && (
          <div className="ui-grid ui-grid-2">
            {list.map(({ donation, match_explanation }) => (
              <div key={donation.id} className="ui-card min-w-0" id={`donation-${donation.id}`}>
                <div className="ui-card-header flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words" data-nexen-id="nx-75b5088a-10">{donation.description}</h3>
                  <span className="ui-badge ui-badge-success" data-nexen-id="nx-75b5088a-11">Open</span>
                </div>
                <div className="ui-card-body">
                  <dl className="ui-kv" data-nexen-id="nx-75b5088a-12">
                    <dt data-nexen-id="nx-75b5088a-13">Donor</dt>
                    <dd data-nexen-id="nx-75b5088a-14">{restaurantNames[donation.restaurantId] ?? 'Unknown restaurant'}</dd>
                    <dt data-nexen-id="nx-75b5088a-15">Portions available</dt>
                    <dd data-nexen-id="nx-75b5088a-16">{donation.portionsRemaining}</dd>
                    <dt data-nexen-id="nx-75b5088a-17">Pickup by</dt>
                    <dd data-nexen-id="nx-75b5088a-18">{formatPickupBy(donation.pickupByAt)}</dd>
                  </dl>
                  <p className="ui-meta" data-nexen-id="nx-75b5088a-19">{match_explanation}</p>
                </div>
                <div className="ui-card-footer">
                  <Link
                    className="ui-btn ui-btn-primary ui-btn-sm"
                    href={`/ngo-claim?donationId=${donation.id}`}
                   data-nexen-id="nx-75b5088a-20">
                    Claim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}