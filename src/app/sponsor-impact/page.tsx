
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMySponsorCampaigns, getMySponsorCampaignById } from '@/lib/api';
import ImpactDashboard from '@/components/ImpactDashboard';
import CampaignRecognitionCard from '@/components/CampaignRecognitionCard';

type Campaign = Awaited<ReturnType<typeof getMySponsorCampaigns>>[number];

export default function SponsorImpactPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSponsor = user?.role === 'csr_sponsor';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (loading || !isSponsor) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await getMySponsorCampaigns();
        const detailed = await Promise.all(
          list.map((c) => getMySponsorCampaignById(c.id).catch(() => c)),
        );
        if (!cancelled) setCampaigns(detailed);
      } catch {
        if (!cancelled) setError('Campaigns could not be loaded.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loading, isSponsor]);

  if (loading) {
    return <p className="p-6 text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-0">Loading…</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isSponsor) {
    return (
      <p className="p-6 text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-1">
        This page is not available for your role.
      </p>
    );
  }

  return (
    <main data-nexen-component="nx_app_sponsor_impact_page" className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6" data-nexen-id="nx-0b0c8a47-2">
      <header className="min-w-0 space-y-2" data-nexen-id="nx-0b0c8a47-3">
        <h1 className="text-2xl font-bold" data-nexen-id="nx-0b0c8a47-4">Sponsor impact</h1>
        <p className="text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-5">
          All people, organisations, addresses and figures on this page are synthetic hackathon data.
        </p>
      </header>

      <section className="space-y-3" data-nexen-id="nx-0b0c8a47-6">
        <h2 className="text-lg font-semibold" data-nexen-id="nx-0b0c8a47-7">Your campaigns</h2>
        {error ? (
          <p role="alert" className="text-sm text-[var(--destructive)]" data-nexen-id="nx-0b0c8a47-8">
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-9">Loading campaigns…</p>
        ) : null}
        {!isLoading && !error && campaigns.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-10">No campaigns yet.</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <div key={c.id} className="min-w-0">
              <CampaignRecognitionCard
                name={c.name}
                recognitionText={c.recognitionText ?? null}
                startsOn={c.startsOn}
                endsOn={c.endsOn}
                isActive={c.status === 'active'}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="min-w-0 space-y-3 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-0b0c8a47-11">
        <h2 className="text-lg font-semibold" data-nexen-id="nx-0b0c8a47-12">Assumptions</h2>
        <ul className="space-y-1 text-sm text-[var(--muted-foreground)]" data-nexen-id="nx-0b0c8a47-13">
          <li data-nexen-id="nx-0b0c8a47-14">
            Estimated waste avoided uses an assumption of 0.35 kg per confirmed portion. It is an estimate, not a measurement.
          </li>
          <li data-nexen-id="nx-0b0c8a47-15">
            Illustrative costs are derived from confirmed portions for demonstration only. They are not actuals and involve no payment or billing data.
          </li>
          <li data-nexen-id="nx-0b0c8a47-16">Only portions confirmed as received by an NGO are counted.</li>
        </ul>
      </section>

      <ImpactDashboard />
    </main>
  );
}