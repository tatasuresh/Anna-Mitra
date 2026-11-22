'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CampaignRecognitionCard from '@/components/CampaignRecognitionCard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  createAdminSponsorCampaignActivate,
  createAdminSponsorCampaignEnd,
  getAdminSponsorCampaigns,
  getMySponsorCampaigns,
} from '@/lib/api';

type Campaign = Awaited<ReturnType<typeof getMySponsorCampaigns>>[number];

export default function SponsorCampaignsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isSponsor = user?.role === 'csr_sponsor';

  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!isAdmin && !isSponsor) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = isAdmin ? await getAdminSponsorCampaigns() : await getMySponsorCampaigns();
        if (!cancelled) setCampaigns(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Campaigns could not be loaded.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isSponsor, reloadKey]);

  async function changeStatus(campaign: Campaign, action: 'activate' | 'end') {
    setBusyId(campaign.id);
    setError(null);
    try {
      if (action === 'activate') await createAdminSponsorCampaignActivate(campaign.id, {});
      else await createAdminSponsorCampaignEnd(campaign.id, {});
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The campaign could not be updated.');
    } finally {
      setBusyId(null);
    }
  }

  if (userLoading || !user) {
    return <p className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-70a97b2b-0">Loading…</p>;
  }

  if (!isAdmin && !isSponsor) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4" data-nexen-id="nx-70a97b2b-1">
        <p className="rounded-[var(--radius)] border bg-card p-4 text-sm" data-nexen-id="nx-70a97b2b-2">
          Sponsor campaigns are not available for your role.{' '}
          <Link href="/" className="underline" data-nexen-id="nx-70a97b2b-3">Go to your home</Link>
        </p>
      </main>
    );
  }

  const rows = Array.isArray(campaigns) ? campaigns : [];

  return (
    <main data-nexen-component="nx_app_sponsor_campaigns_page" className="mx-auto w-full max-w-3xl min-w-0 space-y-4 p-4 sm:p-6" data-nexen-id="nx-70a97b2b-4">
      <header className="min-w-0" data-nexen-id="nx-70a97b2b-5">
        <h1 className="text-2xl font-bold" data-nexen-id="nx-70a97b2b-6">Sponsor campaigns</h1>
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-70a97b2b-7">
          Campaign recognition for {isAdmin ? 'all sponsors' : 'your campaigns'}. Recognition
          is shown for context only.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-[var(--radius)] border border-destructive p-3 text-sm text-destructive" data-nexen-id="nx-70a97b2b-8">
          {error}
        </p>
      )}

      {campaigns === null && !error && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-70a97b2b-9">Loading campaigns…</p>
      )}

      {campaigns !== null && rows.length === 0 && (
        <p className="rounded-[var(--radius)] border bg-card p-4 text-sm text-muted-foreground" data-nexen-id="nx-70a97b2b-10">
          No campaigns yet.
        </p>
      )}

      <ul className="space-y-4" data-nexen-id="nx-70a97b2b-11">
        {rows.map((campaign) => (
          <li key={campaign.id} className="min-w-0 space-y-2" data-nexen-id="nx-70a97b2b-12">
            <CampaignRecognitionCard
              name={campaign.name}
              recognitionText={campaign.recognitionText ?? null}
              startsOn={campaign.startsOn}
              endsOn={campaign.endsOn}
              isActive={campaign.status === 'active'}
            />
            {isAdmin && (
              <div className="flex flex-col gap-2 sm:flex-row">
                {campaign.status === 'draft' && (
                  <button
                    type="button"
                    disabled={busyId === campaign.id}
                    onClick={() => changeStatus(campaign, 'activate')}
                    className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                   data-nexen-id="nx-70a97b2b-13">
                    Activate
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    type="button"
                    disabled={busyId === campaign.id}
                    onClick={() => changeStatus(campaign, 'end')}
                    className="rounded-[var(--radius)] border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                   data-nexen-id="nx-70a97b2b-14">
                    End campaign
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}