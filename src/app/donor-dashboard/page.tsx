'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMyDonorDashboard, getMyRestaurants } from '@/lib/api';
import DonationCard from '@/components/DonationCard';
import type { Donation } from '@/types/donation';
import type { Restaurant } from '@/types/restaurant';

type DonorDashboard = {
  published: number;
  claimed: number;
  delivered: number;
  recent_donations: Donation[];
};

export default function DonorDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [dashboard, setDashboard] = useState<DonorDashboard | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dash: DonorDashboard = await getMyDonorDashboard();
      const restaurants: Restaurant[] = await getMyRestaurants();
      setDashboard(dash);
      setRestaurant(Array.isArray(restaurants) ? (restaurants[0] ?? null) : null);
    } catch {
      setError('Recent activity could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'donor') {
      void load();
    }
  }, [isAuthenticated, user, load]);

  if (loading) {
    return <div className="ui-page"><p className="ui-meta" data-nexen-id="nx-64174fa6-0">Loading…</p></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== 'donor') {
    return (
      <div className="ui-page">
        <p className="ui-meta" data-nexen-id="nx-64174fa6-1">This page is not available for your role.</p>
      </div>
    );
  }

  const recent = Array.isArray(dashboard?.recent_donations) ? dashboard.recent_donations : [];
  const latest = recent[0] ?? null;

  return (
    <div data-nexen-component="nx_app_donor_dashboard_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-64174fa6-2">{restaurant?.name ?? 'Your restaurant'}</h1>
        </div>
        <div className="ui-actions">
          <Link className="ui-btn ui-btn-primary" href="/quick-post" data-nexen-id="nx-64174fa6-3">Post surplus food</Link>
          {latest && (
            <Link className="ui-btn ui-btn-secondary" href={`/quick-post?repeat=${latest.id}`} data-nexen-id="nx-64174fa6-4">
              Repeat last donation
            </Link>
          )}
        </div>
      </div>
      <p className="ui-meta" data-nexen-id="nx-64174fa6-5">
        Repeating a donation opens Quick Post with its details filled in. You will complete a fresh handling checklist before publishing.
      </p>

      <section className="ui-section" data-nexen-id="nx-64174fa6-6">
        <h2 className="ui-section-title" data-nexen-id="nx-64174fa6-7">Recent activity</h2>
        {isLoading && (
          <div className="ui-stack">
            <div className="ui-card animate-pulse h-20" />
            <div className="ui-card animate-pulse h-20" />
            <div className="ui-card animate-pulse h-20" />
          </div>
        )}
        {!isLoading && error && (
          <div className="ui-card">
            <p data-nexen-id="nx-64174fa6-8">{error}</p>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={() => void load()} data-nexen-id="nx-64174fa6-9">
              Try again
            </button>
          </div>
        )}
        {!isLoading && !error && recent.length === 0 && (
          <div className="ui-card">
            <p data-nexen-id="nx-64174fa6-10">No donations yet. Post your first surplus food to get started.</p>
            <Link className="ui-btn ui-btn-primary" href="/quick-post" data-nexen-id="nx-64174fa6-11">Post surplus food</Link>
          </div>
        )}
        {!isLoading && !error && recent.length > 0 && (
          <div className="ui-stack">
            {recent.map((donation) => (
              <div key={donation.id} className="min-w-0">
                <DonationCard donation={donation} ngoName={null} />
              </div>
            ))}
          </div>
        )}
        <p className="ui-meta" data-nexen-id="nx-64174fa6-12"><Link className="ui-link" href="/donations" data-nexen-id="nx-64174fa6-13">View all donations</Link></p>
      </section>

      <section className="ui-section" data-nexen-id="nx-64174fa6-14">
        <h2 className="ui-section-title" data-nexen-id="nx-64174fa6-15">Status summary</h2>
        <div className="ui-grid ui-grid-4">
          {isLoading ? (
            <>
              <div className="ui-stat animate-pulse h-20" />
              <div className="ui-stat animate-pulse h-20" />
              <div className="ui-stat animate-pulse h-20" />
            </>
          ) : (
            <>
              <div className="ui-stat"><span className="ui-stat-label" data-nexen-id="nx-64174fa6-16">Published</span><span className="ui-stat-value" data-nexen-id="nx-64174fa6-17">{dashboard?.published ?? 0}</span><span className="ui-stat-note" data-nexen-id="nx-64174fa6-18">Donations</span></div>
              <div className="ui-stat"><span className="ui-stat-label" data-nexen-id="nx-64174fa6-19">Claimed</span><span className="ui-stat-value" data-nexen-id="nx-64174fa6-20">{dashboard?.claimed ?? 0}</span><span className="ui-stat-note" data-nexen-id="nx-64174fa6-21">Donations</span></div>
              <div className="ui-stat"><span className="ui-stat-label" data-nexen-id="nx-64174fa6-22">Delivered</span><span className="ui-stat-value" data-nexen-id="nx-64174fa6-23">{dashboard?.delivered ?? 0}</span><span className="ui-stat-note" data-nexen-id="nx-64174fa6-24">Donations</span></div>
            </>
          )}
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-64174fa6-25">
        <h2 className="ui-section-title" data-nexen-id="nx-64174fa6-26">Quick links</h2>
        <div className="ui-grid ui-grid-2">
          <Link className="ui-card ui-card-link min-w-0" href="/restaurant-preferences" data-nexen-id="nx-64174fa6-27">
            <div className="ui-card-header"><h3 data-nexen-id="nx-64174fa6-28">Restaurant preferences</h3></div>
            <div className="ui-card-body"><p data-nexen-id="nx-64174fa6-29">Default portions and your usual pickup window.</p></div>
          </Link>
          <Link className="ui-card ui-card-link min-w-0" href="/donations" data-nexen-id="nx-64174fa6-30">
            <div className="ui-card-header"><h3 data-nexen-id="nx-64174fa6-31">Donation tracking</h3></div>
            <div className="ui-card-body"><p data-nexen-id="nx-64174fa6-32">The full list of your donations and their statuses.</p></div>
          </Link>
        </div>
      </section>
    </div>
  );
}