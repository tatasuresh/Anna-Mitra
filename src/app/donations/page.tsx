'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DonationList from '@/components/DonationList';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getMyDonations } from '@/lib/api';
import type { Donation } from '@/types/donation';

export default function DonationsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDonor = user?.role === 'donor';

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await getMyDonations();
      setDonations(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Donations could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isDonor) {
      void load();
    }
  }, [isDonor, load]);

  if (userLoading) {
    return <p className="ui-meta" data-nexen-id="nx-b2e481d9-0">Loading…</p>;
  }

  if (!user) {
    return null;
  }

  if (!isDonor) {
    return (
      <div className="ui-page">
        <p className="ui-meta" data-nexen-id="nx-b2e481d9-1">This page is not available for your role.</p>
      </div>
    );
  }

  const count = donations?.length ?? 0;

  return (
    <div data-nexen-component="nx_app_donations_page" className="ui-page">
      <div className="ui-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 data-nexen-id="nx-b2e481d9-2">Your donations</h1>
          <p className="ui-meta" data-nexen-id="nx-b2e481d9-3">
            {count} {count === 1 ? 'donation' : 'donations'} posted
          </p>
        </div>
        <div className="ui-actions">
          <Link className="ui-btn ui-btn-primary" href="/quick-post" data-nexen-id="nx-b2e481d9-4">
            New post
          </Link>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-b2e481d9-5">
        <h2 className="ui-section-title" data-nexen-id="nx-b2e481d9-6">Donations</h2>
        <div className="overflow-x-auto">
          <DonationList
            donations={donations}
            isLoading={isLoading}
            error={error}
            onRetry={load}
          />
        </div>
      </section>
    </div>
  );
}