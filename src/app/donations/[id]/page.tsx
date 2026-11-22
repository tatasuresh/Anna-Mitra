'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HandlingChecklist from '@/components/HandlingChecklist';
import StatusTimeline from '@/components/StatusTimeline';
import {
  createMyDonationCancel,
  getAuthMe,
  getDonationById,
  getDonationStatusEvents,
} from '@/lib/api';

type DonationDetail = Awaited<ReturnType<typeof getDonationById>>;
type StatusEvents = Awaited<ReturnType<typeof getDonationStatusEvents>>;

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function DonationDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [detail, setDetail] = useState<DonationDetail | null>(null);
  const [events, setEvents] = useState<StatusEvents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelledStatus, setCancelledStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAuthMe()
      .then((user) => {
        if (active) setRole(user.role);
      })
      .catch(() => {
        if (active) router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [donationResult, eventsResult] = await Promise.all([
        getDonationById(id),
        getDonationStatusEvents(id),
      ]);
      setDetail(donationResult);
      setEvents(eventsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This donation could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleCancel() {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await createMyDonationCancel(id, {});
      setCancelledStatus(updated.status);
      await loadAll();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'The donation could not be cancelled.');
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading && !detail) {
    return <p className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-576f0269-0">Loading donation…</p>;
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4">
        <p role="alert" className="rounded-[var(--radius)] border border-border bg-card p-4 text-sm" data-nexen-id="nx-576f0269-1">
          {error ?? 'This donation is not available for your role.'}
        </p>
        <Link href="/donations" className="mt-4 inline-block text-sm text-primary" data-nexen-id="nx-576f0269-2">
          Back to donations
        </Link>
      </div>
    );
  }

  const { donation, restaurant } = detail;
  const isDonor = role === 'donor';
  const canCancel = isDonor && (donation.status === 'draft' || donation.status === 'published');
  const canEditDeclarations = isDonor && donation.status === 'draft';

  return (
    <div data-nexen-component="nx_app_donations__id__page" className="mx-auto w-full max-w-2xl min-w-0 space-y-6 p-4">
      <Link href="/donations" className="text-sm text-muted-foreground hover:text-foreground" data-nexen-id="nx-576f0269-3">
        ← Back to donations
      </Link>

      <section className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6" data-nexen-id="nx-576f0269-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="min-w-0 break-words text-xl font-bold" data-nexen-id="nx-576f0269-5">{donation.description}</h1>
          <span className="inline-block w-fit rounded-[999px] bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary" data-nexen-id="nx-576f0269-6">
            {formatStatus(donation.status)}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2" data-nexen-id="nx-576f0269-7">
          <div className="min-w-0">
            <dt className="text-muted-foreground" data-nexen-id="nx-576f0269-8">Restaurant</dt>
            <dd className="break-words" data-nexen-id="nx-576f0269-9">{restaurant?.name ?? '—'}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground" data-nexen-id="nx-576f0269-10">Portions</dt>
            <dd data-nexen-id="nx-576f0269-11">
              {donation.portionsRemaining} of {donation.portionsTotal} remaining
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground" data-nexen-id="nx-576f0269-12">Pickup location</dt>
            <dd className="break-words" data-nexen-id="nx-576f0269-13">{donation.pickupLocation}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground" data-nexen-id="nx-576f0269-14">Pickup by</dt>
            <dd data-nexen-id="nx-576f0269-15">{new Date(donation.pickupByAt).toLocaleString('en-IN')}</dd>
          </div>
        </dl>

        {canCancel && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full rounded-[var(--radius)] border border-border px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50 sm:w-auto"
             data-nexen-id="nx-576f0269-16">
              {isCancelling ? 'Cancelling…' : 'Cancel donation'}
            </button>
            {cancelledStatus && (
              <p className="text-sm text-muted-foreground" data-nexen-id="nx-576f0269-17">
                Donation status is now {formatStatus(cancelledStatus)}.
              </p>
            )}
            {cancelError && (
              <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-576f0269-18">
                {cancelError}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6" data-nexen-id="nx-576f0269-19">
        <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-576f0269-20">Handling declarations</h2>
        <HandlingChecklist
          donationId={id}
          disabled={!canEditDeclarations}
          onSaved={() => void loadAll()}
        />
      </section>

      <section className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6" data-nexen-id="nx-576f0269-21">
        <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-576f0269-22">Status history</h2>
        <StatusTimeline events={events} />
      </section>
    </div>
  );
}