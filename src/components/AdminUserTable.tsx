'use client';

import { useState } from 'react';
import { createAdminUserApprove, createAdminUserSuspend } from '@/lib/api';
import type { User } from '@/types/user';

type AdminUserTableProps = {
  users?: User[] | null;
  onChanged?: () => void;
};

type Action = 'approve' | 'suspend';

function labelOf(value: string | null | undefined): string {
  return (value ?? '').replace(/_/g, ' ');
}

function statusClass(status: string): string {
  if (status === 'approved') return 'bg-primary/10 text-primary';
  if (status === 'suspended') return 'bg-destructive/10 text-destructive';
  return 'bg-accent/20 text-foreground';
}

export default function AdminUserTable({ users, onChanged }: AdminUserTableProps) {
  const safeUsers = Array.isArray(users) ? users : [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(user: User, action: Action) {
    setBusyId(user.id);
    setError(null);
    try {
      if (action === 'approve') {
        await createAdminUserApprove(user.id, {});
      } else {
        await createAdminUserSuspend(user.id, {});
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action could not be completed. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (safeUsers.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        No participants to show.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {error && (
        <p role="alert" className="rounded-[var(--radius)] bg-destructive/10 px-3 py-2 text-sm text-destructive" data-nexen-id="nx-3da41327-0">
          {error}
        </p>
      )}
      <div className="w-full overflow-x-auto rounded-[var(--radius)] border bg-card shadow-sm">
        <table className="min-w-full text-sm" data-nexen-id="nx-3da41327-1">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-3da41327-2">
            <tr data-nexen-id="nx-3da41327-3">
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-3da41327-4">Name</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-3da41327-5">Email</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-3da41327-6">Role</th>
              <th className="px-4 py-3 font-semibold" data-nexen-id="nx-3da41327-7">Status</th>
              <th className="px-4 py-3 text-right font-semibold" data-nexen-id="nx-3da41327-8">Actions</th>
            </tr>
          </thead>
          <tbody data-nexen-id="nx-3da41327-9">
            {safeUsers.map((user) => {
              const status = String(user.status ?? '');
              const isBusy = busyId === user.id;
              const canApprove = status === 'pending_approval' || status === 'suspended';
              const canSuspend = status === 'approved';
              return (
                <tr data-nexen-component="nx_components_AdminUserTable" key={user.id} className="border-b last:border-b-0" data-nexen-id="nx-3da41327-10">
                  <td className="px-4 py-3 font-medium text-foreground" data-nexen-id="nx-3da41327-11">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground" data-nexen-id="nx-3da41327-12">{user.email}</td>
                  <td className="px-4 py-3 capitalize" data-nexen-id="nx-3da41327-13">{labelOf(String(user.role ?? ''))}</td>
                  <td className="px-4 py-3" data-nexen-id="nx-3da41327-14">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(status)}`} data-nexen-id="nx-3da41327-15">
                      {labelOf(status)}
                    </span>
                  </td>
                  <td className="px-4 py-3" data-nexen-id="nx-3da41327-16">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      {canApprove && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => runAction(user, 'approve')}
                          className="rounded-[var(--radius)] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                         data-nexen-id="nx-3da41327-17">
                          {isBusy ? 'Saving...' : 'Approve'}
                        </button>
                      )}
                      {canSuspend && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => runAction(user, 'suspend')}
                          className="rounded-[var(--radius)] border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-50"
                         data-nexen-id="nx-3da41327-18">
                          {isBusy ? 'Saving...' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}