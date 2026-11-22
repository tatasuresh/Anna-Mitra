'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminUserTable from '@/components/AdminUserTable';
import RescueMonitorTable from '@/components/RescueMonitorTable';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  getAdminDonationClaims,
  getAdminDonations,
  getAdminOperationsSummary,
  getAdminPickupTasks,
  getAdminUsers,
} from '@/lib/api';
import type { User } from '@/types/user';
import type { PickupTask } from '@/types/pickuptask';
import type { Donation } from '@/types/donation';
import type { DonationClaim } from '@/types/donationclaim';

type OperationsSummary = {
  pending_approvals: number;
  active_rescues: number;
  failed_assignments: number;
  suspended_users: number;
};

const ACTIVE_DONATION_STATUSES = ['claimed', 'partially_claimed', 'in_transit'];

export default function AdminOperationsPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [tasks, setTasks] = useState<PickupTask[] | null>(null);
  const [rescues, setRescues] = useState<Donation[] | null>(null);
  const [claims, setClaims] = useState<DonationClaim[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, u, t, d, c] = await Promise.all([
        getAdminOperationsSummary(),
        getAdminUsers(),
        getAdminPickupTasks(),
        getAdminDonations(),
        getAdminDonationClaims(),
      ]);
      setSummary(s);
      setUsers(u);
      setTasks(t);
      setRescues(d.filter((donation) => ACTIVE_DONATION_STATUSES.includes(donation.status)));
      setClaims(c.filter((claim) => claim.status === 'reserved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operations could not be loaded.');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      void load();
    }
  }, [user, load]);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground" data-nexen-id="nx-6fd82eec-0">Loading…</p>;
  }
  if (!user) {
    return null;
  }
  if (user.role !== 'admin') {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <div className="rounded-[var(--radius)] border bg-card p-6 text-sm shadow-sm">
          This page is not available for your role.
        </div>
      </div>
    );
  }

  const sortedUsers = Array.isArray(users)
    ? [...users].sort((a, b) => {
        const aPending = a.status === 'pending_approval' ? 0 : 1;
        const bPending = b.status === 'pending_approval' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return String(a.createdAt).localeCompare(String(b.createdAt));
      })
    : null;

  const safeRescues = Array.isArray(rescues) ? rescues : [];
  const safeClaims = Array.isArray(claims) ? claims : [];

  const stats = [
    { label: 'Pending approvals', value: summary?.pending_approvals ?? 0 },
    { label: 'Active rescues', value: summary?.active_rescues ?? 0 },
    { label: 'Failed assignments', value: summary?.failed_assignments ?? 0 },
    { label: 'Suspended users', value: summary?.suspended_users ?? 0 },
  ];

  return (
    <div data-nexen-component="nx_app_admin_operations_page" className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="min-w-0" data-nexen-id="nx-6fd82eec-1">
        <h1 className="text-2xl font-bold" data-nexen-id="nx-6fd82eec-2">Admin operations</h1>
      </header>

      {error && (
        <div className="rounded-[var(--radius)] border bg-card p-4 text-sm shadow-sm">
          <p data-nexen-id="nx-6fd82eec-3">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 rounded-[var(--radius)] border px-3 py-1 text-sm"
           data-nexen-id="nx-6fd82eec-4">
            Try again
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-nexen-id="nx-6fd82eec-5">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground" data-nexen-id="nx-6fd82eec-6">{stat.label}</p>
            <p className="text-2xl font-bold" data-nexen-id="nx-6fd82eec-7">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-6fd82eec-8">
        <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-6fd82eec-9">Participants</h2>
        <div className="overflow-x-auto">
          <AdminUserTable users={sortedUsers} onChanged={() => void load()} />
        </div>
      </section>

      <section className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm" data-nexen-id="nx-6fd82eec-10">
        <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-6fd82eec-11">Rescues and failed assignments</h2>
        <div className="overflow-x-auto">
          <RescueMonitorTable tasks={tasks} onResolved={() => void load()} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" data-nexen-id="nx-6fd82eec-12">
        <div className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-6fd82eec-13">Open donations</h2>
          {safeRescues.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-nexen-id="nx-6fd82eec-14">No rescues in progress.</p>
          ) : (
            <ul className="flex flex-col gap-2" data-nexen-id="nx-6fd82eec-15">
              {safeRescues.map((donation) => (
                <li key={donation.id} className="flex min-w-0 flex-col gap-1 rounded-[var(--radius)] border p-3 sm:flex-row sm:items-center sm:justify-between" data-nexen-id="nx-6fd82eec-16">
                  <span className="min-w-0 flex-1 truncate text-sm" data-nexen-id="nx-6fd82eec-17">{donation.description}</span>
                  <span className="text-xs text-muted-foreground" data-nexen-id="nx-6fd82eec-18">{donation.status}</span>
                  <Link href={`/donations/${donation.id}`} className="text-sm font-semibold underline" data-nexen-id="nx-6fd82eec-19">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 rounded-[var(--radius)] border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold" data-nexen-id="nx-6fd82eec-20">Reserved claims</h2>
          {safeClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-nexen-id="nx-6fd82eec-21">No reserved claims.</p>
          ) : (
            <ul className="flex flex-col gap-2" data-nexen-id="nx-6fd82eec-22">
              {safeClaims.map((claim) => (
                <li key={claim.id} className="flex min-w-0 flex-col gap-1 rounded-[var(--radius)] border p-3 sm:flex-row sm:items-center sm:justify-between" data-nexen-id="nx-6fd82eec-23">
                  <span className="min-w-0 flex-1 truncate text-sm" data-nexen-id="nx-6fd82eec-24">{claim.portionsClaimed} portions</span>
                  <Link href={`/donations/${claim.donationId}`} className="text-sm font-semibold underline" data-nexen-id="nx-6fd82eec-25">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}