'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClaimForm from '@/components/ClaimForm';
import ConfirmWindowTimer from '@/components/ConfirmWindowTimer';
import { useAuth } from '@/lib/auth';
import {
  getDonationById,
  getMyDonationClaims,
  getMyNgoCapacity,
  createMyDonationClaimRelease,
} from '@/lib/api';

type DonationDetail = Awaited<ReturnType<typeof getDonationById>>;
type ClaimRow = Awaited<ReturnType<typeof getMyDonationClaims>>[number];

export default function NgoClaimPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [donationId, setDonationId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DonationDetail | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [maxPerClaim, setMaxPerClaim] = useState<number>(0);
  const [pastPickup, setPastPickup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    setDonationId(new URLSearchParams(window.location.search).get('donationId'));
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!donationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [donationResult, claimRows, capacity] = await Promise.all([
        getDonationById(donationId),
        getMyDonationClaims(),
        getMyNgoCapacity().catch(() => null),
      ]);
      setDetail(donationResult);
      setClaims(Array.isArray(claimRows) ? claimRows : []);
      setMaxPerClaim(capacity?.maxPortionsPerClaim ?? donationResult.donation.portionsRemaining);
      setPastPickup(new Date(donationResult.donation.pickupByAt).getTime() <= Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This donation could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [donationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || !isAuthenticated) {
    return <p className="p-6 text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-0">Loading…</p>;
  }

  if (user?.role !== 'ngo') {
    return (
      <main className="mx-auto w-full max-w-xl p-4" data-nexen-id="nx-35e17a85-1">
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-2">This page is not available for your role.</p>
      </main>
    );
  }

  const donation = detail?.donation ?? null;
  const reserved = claims.filter((c) => c.donationId === donationId && c.status === 'reserved');
  const activeClaim = reserved.length > 0 ? reserved[reserved.length - 1] : null;
  const windowSeconds = activeClaim
    ? Math.max(
        1,
        Math.round(
          (new Date(activeClaim.reservedUntil).getTime() - new Date(activeClaim.createdAt).getTime()) / 1000,
        ),
      )
    : 0;

  async function handleRelease() {
    if (!activeClaim) return;
    setIsReleasing(true);
    setReleaseError(null);
    try {
      await createMyDonationClaimRelease(activeClaim.id, {});
      await load();
    } catch (e) {
      setReleaseError(e instanceof Error ? e.message : 'The claim could not be released.');
    } finally {
      setIsReleasing(false);
    }
  }

  return (
    <main data-nexen-component="nx_app_ngo_claim_page" className="mx-auto w-full max-w-xl space-y-4 p-4" data-nexen-id="nx-35e17a85-3">
      <h1 className="text-xl font-semibold" data-nexen-id="nx-35e17a85-4">Claim donation</h1>

      {!donationId && <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-5">No donation selected.</p>}
      {isLoading && <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-6">Loading donation…</p>}
      {error && <p className="text-sm text-[hsl(var(--danger))]" data-nexen-id="nx-35e17a85-7">{error}</p>}

      {donation && (
        <section className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-35e17a85-8">
          <p className="break-words font-medium" data-nexen-id="nx-35e17a85-9">{donation.description}</p>
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-10">
            {donation.portionsRemaining} portions available · {donation.pickupLocation}
          </p>
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-11">
            Pickup by{' '}
            {new Date(donation.pickupByAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </section>
      )}

      {donation && pastPickup && !activeClaim && (
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-35e17a85-12">The pickup time has passed, so this donation can no longer be claimed.</p>
      )}

      {donation && !pastPickup && !activeClaim && donation.portionsRemaining > 0 && (
        <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-35e17a85-13">
          <ClaimForm
            donationId={donation.id}
            portionsAvailable={donation.portionsRemaining}
            maxPerClaim={maxPerClaim}
            onClaimed={load}
          />
        </section>
      )}

      {activeClaim && (
        <section className="space-y-3 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-35e17a85-14">
          <p className="text-sm" data-nexen-id="nx-35e17a85-15">
            You reserved <span className="font-semibold" data-nexen-id="nx-35e17a85-16">{activeClaim.portionsClaimed}</span> portions. Confirm before the window closes.
          </p>
          <ConfirmWindowTimer
            expiresAt={activeClaim.reservedUntil}
            windowSeconds={windowSeconds}
            label="Confirmation window"
            onExpire={load}
          />
          {releaseError && <p className="text-sm text-[hsl(var(--danger))]" data-nexen-id="nx-35e17a85-17">{releaseError}</p>}
          <button
            type="button"
            onClick={handleRelease}
            disabled={isReleasing}
            className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold disabled:opacity-50 sm:w-auto"
           data-nexen-id="nx-35e17a85-18">
            {isReleasing ? 'Releasing…' : 'Release claim'}
          </button>
        </section>
      )}
    </main>
  );
}