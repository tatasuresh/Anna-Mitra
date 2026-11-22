'use client';

import { useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DemoRoleCard from '@/components/DemoRoleCard';
import { createAuthDemoLogin } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type DemoRole = ComponentProps<typeof DemoRoleCard>['role'];

type RoleOption = {
  role: DemoRole;
  label: string;
  description: string;
  home: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'donor',
    label: 'Donor',
    description: 'Restaurants post surplus edible food for pickup.',
    home: '/donor-dashboard',
  },
  {
    role: 'ngo',
    label: 'NGO',
    description: 'Claim surplus food that matches your current need.',
    home: '/ngo-feed',
  },
  {
    role: 'volunteer',
    label: 'Volunteer / NGO Transporter',
    description: 'Accept and carry pickups between restaurants and NGOs.',
    home: '/volunteer-tasks',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Approve accounts and keep rescue operations running.',
    home: '/admin-operations',
  },
  {
    role: 'csr_sponsor',
    label: 'CSR Sponsor',
    description: 'See confirmed rescue impact for your sponsored campaigns.',
    home: '/sponsor-impact',
  },
];

export default function RoleEntryPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [busyRole, setBusyRole] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = ROLE_OPTIONS.find((option) => option.role === selectedRole) ?? null;

  async function enterDemo(role: DemoRole | null) {
    const option = ROLE_OPTIONS.find((item) => item.role === role);
    if (!role || !option) {
      setError('Choose a role to continue.');
      return;
    }
    setBusyRole(role);
    setError(null);
    try {
      await createAuthDemoLogin({ role });
      await refresh();
      router.push(option.home);
    } catch {
      setError('The demo could not start. Try again, or log in with your account instead.');
    } finally {
      setBusyRole(null);
    }
  }

  const loginHref = selectedRole ? `/login?role=${selectedRole}` : '/login';

  return (
    <div data-nexen-component="nx_app_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-3393394e-0">Anna Mitra</h1>
          <p className="ui-meta" data-nexen-id="nx-3393394e-1">
            Lets restaurants post surplus edible food, matches it to nearby NGOs, coordinates volunteer
            pickup and reports confirmed rescue impact.
          </p>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-3393394e-2">
        <div className="ui-card ui-card-body">
          <h2 className="ui-section-title" data-nexen-id="nx-3393394e-3">Choose your role</h2>
          <p className="ui-meta" data-nexen-id="nx-3393394e-4">
            Pick a role to try the pilot with its instant demo account. All people and details in the demo
            are synthetic.
          </p>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-3393394e-5">
        <h2 className="ui-section-title" data-nexen-id="nx-3393394e-6">Roles</h2>
        <div className="ui-grid ui-grid-3">
          {ROLE_OPTIONS.map((option) => (
            <DemoRoleCard
              key={option.role}
              role={option.role}
              label={option.label}
              description={option.description}
              isSelected={selectedRole === option.role}
              isBusy={busyRole === option.role}
              onSelect={(role) => {
                setSelectedRole(role);
                setError(null);
              }}
              onEnterDemo={(role) => enterDemo(role)}
            />
          ))}
        </div>
      </section>

      {selectedOption && (
        <section className="ui-section" data-nexen-id="nx-3393394e-7">
          <div className="ui-card ui-card-body">
            <h2 className="ui-section-title" data-nexen-id="nx-3393394e-8">Demo account: {selectedOption.label}</h2>
            <p className="ui-meta" data-nexen-id="nx-3393394e-9">
              You are entering the synthetic demo account for this role. All people, names and details are
              synthetic.
            </p>
            <div className="ui-actions">
              <button
                className="ui-btn ui-btn-primary"
                type="button"
                disabled={busyRole !== null}
                onClick={() => enterDemo(selectedRole)}
               data-nexen-id="nx-3393394e-10">
                {busyRole === selectedRole ? 'Starting demo…' : 'Enter demo'}
              </button>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="ui-section" data-nexen-id="nx-3393394e-11">
          <div className="ui-card ui-card-body">
            <p role="alert" className="ui-meta" data-nexen-id="nx-3393394e-12">
              {error}
            </p>
            <div className="ui-actions">
              <Link className="ui-btn ui-btn-secondary" href="/login" data-nexen-id="nx-3393394e-13">
                Log in with my account
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="ui-section" data-nexen-id="nx-3393394e-14">
        <div className="ui-card">
          <div className="ui-card-body">
            <h2 className="ui-section-title" data-nexen-id="nx-3393394e-15">Already have an account?</h2>
            <p className="ui-meta" data-nexen-id="nx-3393394e-16">
              Demo sign-in is for the hackathon pilot only. No OTP or KYC step is shown here, and no location
              is requested.
            </p>
          </div>
          <div className="ui-card-footer">
            <div className="ui-actions">
              <Link className="ui-btn ui-btn-secondary" href={loginHref} data-nexen-id="nx-3393394e-17">
                Log in with my account
              </Link>
              <Link className="ui-btn ui-btn-primary" href="/signup" data-nexen-id="nx-3393394e-18">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}