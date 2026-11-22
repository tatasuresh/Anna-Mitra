'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ApiError, createMyPickupTaskFail, getDonationStatusEvents, getMyPickupTasks } from '@/lib/api';
import PickupActionCard from '@/components/PickupActionCard';
import StatusTimeline from '@/components/StatusTimeline';

type PickupTask = Awaited<ReturnType<typeof getMyPickupTasks>>[number];
type StatusEventList = Awaited<ReturnType<typeof getDonationStatusEvents>>;

const ACTIVE_STATUSES: string[] = ['accepted', 'collected'];

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [task, setTask] = useState<PickupTask | null>(null);
  const [events, setEvents] = useState<StatusEventList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasks = await getMyPickupTasks();
      const current =
        tasks.find((t) => ACTIVE_STATUSES.includes(t.status)) ??
        tasks.find((t) => t.status === 'handed_over') ??
        null;
      setTask(current);
      setEvents(current ? await getDonationStatusEvents(current.donationId) : null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Your pickup could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'volunteer') {
      void load();
    } else {
      setIsLoading(false);
    }
  }, [user, userLoading, router, load]);

  async function submitReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!task) return;
    if (!reason.trim()) {
      setReasonError('Describe the problem so an admin can resolve it.');
      return;
    }
    setReasonError(null);
    setIsSubmitting(true);
    try {
      await createMyPickupTaskFail(task.id, { failure_reason: reason.trim() });
      setReporting(false);
      setReason('');
      await load();
    } catch (err) {
      setReasonError(err instanceof ApiError ? err.message : 'The problem could not be reported.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (userLoading || isLoading) {
    return <main className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-f82f212e-0">Loading your pickup…</main>;
  }

  if (!user || user.role !== 'volunteer') {
    return (
      <main className="p-4 text-sm text-muted-foreground" data-nexen-id="nx-f82f212e-1">
        Active delivery is not available for your role.
      </main>
    );
  }

  const canReport = task ? ACTIVE_STATUSES.includes(task.status) : false;

  return (
    <main data-nexen-component="nx_app_active_delivery_page" className="mx-auto w-full max-w-xl min-w-0 space-y-4 p-4" data-nexen-id="nx-f82f212e-2">
      <h1 className="text-2xl font-bold text-foreground" data-nexen-id="nx-f82f212e-3">Active delivery</h1>

      {error && <p className="text-sm text-destructive" data-nexen-id="nx-f82f212e-4">{error}</p>}

      {!task && !error && (
        <div className="rounded-[var(--radius)] border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-f82f212e-5">No active pickup right now.</p>
          <Link href="/volunteer-tasks" className="mt-2 inline-block text-sm font-semibold text-primary" data-nexen-id="nx-f82f212e-6">
            Go to Volunteer Tasks
          </Link>
        </div>
      )}

      {task && (
        <>
          <PickupActionCard task={task} onChanged={load} />

          <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-f82f212e-7">
            <h2 className="mb-2 text-base font-semibold text-foreground" data-nexen-id="nx-f82f212e-8">Status updates</h2>
            <StatusTimeline events={events} />
          </section>

          {canReport && (
            <section className="rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-f82f212e-9">
              {!reporting ? (
                <button
                  type="button"
                  onClick={() => setReporting(true)}
                  className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold text-foreground"
                 data-nexen-id="nx-f82f212e-10">
                  Report a problem
                </button>
              ) : (
                <form onSubmit={submitReport} className="space-y-3" data-nexen-id="nx-f82f212e-11">
                  <label className="block text-sm font-medium text-foreground" htmlFor="failure-reason" data-nexen-id="nx-f82f212e-12">
                    What went wrong?
                  </label>
                  <textarea
                    id="failure-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full min-w-0 rounded-[var(--radius)] border bg-background p-3 text-sm"
                   data-nexen-id="nx-f82f212e-13"/>
                  {reasonError && <p className="text-sm text-destructive" data-nexen-id="nx-f82f212e-14">{reasonError}</p>}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-[var(--radius)] bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                     data-nexen-id="nx-f82f212e-15">
                      {isSubmitting ? 'Reporting…' : 'Submit problem'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReporting(false);
                        setReasonError(null);
                      }}
                      className="w-full rounded-[var(--radius)] border px-4 py-3 text-sm font-semibold text-foreground"
                     data-nexen-id="nx-f82f212e-16">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}