'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

type NavItem = { href: string; label: string };

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

const HEAD_ITEMS: NavItem[] = [
  { href: '/', label: 'Role Entry' },
  { href: '/profile', label: 'Profile' },
];

const TAIL_ITEMS: NavItem[] = [
  { href: '/users', label: 'Users' },
  { href: '/sponsor-campaigns', label: 'Sponsor Campaigns' },
  { href: '/settings', label: 'Settings' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/ngos', label: 'NGO Organisations' },
];

const ROLE_ITEMS: Record<string, NavItem[]> = {
  donor: [
    { href: '/donor-dashboard', label: 'Donor Dashboard' },
    { href: '/restaurant-preferences', label: 'Restaurant Preferences' },
    { href: '/quick-post', label: 'Quick Post' },
    { href: '/donations', label: 'Tracking' },
  ],
  ngo: [
    { href: '/ngo-feed', label: 'NGO Feed' },
    { href: '/ngo-claim', label: 'NGO Claim' },
    { href: '/ngo-capacity', label: 'NGO Capacity' },
  ],
  volunteer: [
    { href: '/volunteer-tasks', label: 'Volunteer Tasks' },
    { href: '/active-delivery', label: 'Active Delivery' },
  ],
  admin: [{ href: '/admin-operations', label: 'Admin Operations' }],
  csr_sponsor: [{ href: '/sponsor-impact', label: 'Sponsor Impact' }],
};

const ROLE_LABELS: Record<string, string> = {
  donor: 'Donor',
  ngo: 'NGO',
  volunteer: 'Volunteer / NGO Transporter',
  admin: 'Admin',
  csr_sponsor: 'CSR Sponsor',
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return <>{children}</>;
  }

  const roleItems = user
    ? ROLE_ITEMS[user.role] ?? []
    : Object.values(ROLE_ITEMS).flat();
  const items: NavItem[] = [...HEAD_ITEMS, ...roleItems, ...TAIL_ITEMS];

  const initials =
    (user?.name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'AM';

  const persona = user ? ROLE_LABELS[user.role] ?? user.role : '';

  const signOut = () => {
    setOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <div className="ui-shell flex min-h-screen flex-col bg-background text-foreground sm:flex-row">
      <aside
        className={`ui-sidebar ${
          open ? 'flex' : 'hidden'
        } min-w-0 flex-col gap-4 border-b border-border bg-card p-4 sm:flex sm:shrink-0 sm:max-w-56 sm:border-b-0 sm:border-r`}
       data-nexen-id="nx-2bffa68a-0">
        <div className="ui-brand flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-semibold">
            <img
              src="/nexen-logo.png"
              alt=""
              className="h-8 w-8 shrink-0 rounded-[var(--radius)]"
             data-nexen-id="nx-2bffa68a-1"/>
            <span className="truncate" data-nexen-id="nx-2bffa68a-2">Anna Mitra</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm sm:hidden"
           data-nexen-id="nx-2bffa68a-3">
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        <nav className="ui-nav flex flex-col gap-1" data-nexen-id="nx-2bffa68a-4">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`truncate rounded-[var(--radius)] px-3 py-2 text-sm ${
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
               data-nexen-id="nx-2bffa68a-5">
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <button data-nexen-component="nx_components_AppShell"
            type="button"
            onClick={signOut}
            className="rounded-[var(--radius)] border border-border px-3 py-2 text-left text-sm sm:hidden"
           data-nexen-id="nx-2bffa68a-6">
            Sign out
          </button>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="ui-topbar flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3" data-nexen-id="nx-2bffa68a-7">
          <div className="ui-user flex min-w-0 items-center gap-2 text-sm">
            <span className="ui-avatar grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" data-nexen-id="nx-2bffa68a-8">
              {initials}
            </span>
            {user && (
              <>
                <span className="min-w-0 truncate font-medium" data-nexen-id="nx-2bffa68a-9">{user.name}</span>
                <span className="hidden text-muted-foreground sm:inline" data-nexen-id="nx-2bffa68a-10">· {persona}</span>
              </>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={signOut}
              className="hidden shrink-0 rounded-[var(--radius)] border border-border px-3 py-1.5 text-sm sm:inline-flex"
             data-nexen-id="nx-2bffa68a-11">
              Sign out
            </button>
          )}
        </header>

        <main className="ui-content min-w-0 flex-1 p-4 sm:p-6" data-nexen-id="nx-2bffa68a-12">{children}</main>
      </div>
    </div>
  );
}