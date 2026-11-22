'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminUserTable from '@/components/AdminUserTable';
import { getAdminUsers, getAuthMe } from '@/lib/api';
import type { User } from '@/types/user';

export default function UsersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const list = await getAdminUsers();
      setUsers(Array.isArray(list) ? list : []);
      setError(null);
    } catch {
      setError('Users could not be loaded.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await getAuthMe();
        if (!active) return;
        setRole(me.role);
        if (me.role === 'admin') {
          await loadUsers();
        }
      } catch {
        if (active) router.replace('/login');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadUsers, router]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" data-nexen-id="nx-e3ade49e-0">
        <p className="text-muted-foreground" data-nexen-id="nx-e3ade49e-1">Loading users…</p>
      </main>
    );
  }

  if (role !== 'admin') {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" data-nexen-id="nx-e3ade49e-2">
        <div className="rounded-[var(--radius)] border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold" data-nexen-id="nx-e3ade49e-3">Not available for your role</h1>
          <p className="mt-2 text-sm text-muted-foreground" data-nexen-id="nx-e3ade49e-4">
            Managing users is limited to administrators.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary" data-nexen-id="nx-e3ade49e-5">
            Go to your home page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main data-nexen-component="nx_app_users_page" className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6" data-nexen-id="nx-e3ade49e-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between" data-nexen-id="nx-e3ade49e-7">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary" data-nexen-id="nx-e3ade49e-8">Administration</p>
          <h1 className="text-2xl font-bold" data-nexen-id="nx-e3ade49e-9">Manage users</h1>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius)] border p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="min-w-0 overflow-x-auto rounded-[var(--radius)] border bg-card shadow-sm">
        <AdminUserTable users={users} onChanged={loadUsers} />
      </div>
    </main>
  );
}