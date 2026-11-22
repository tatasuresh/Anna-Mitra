'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/lib/auth';
import { createAuthLogout, updateAuthMe } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS: Record<string, string> = {
  donor: 'Donor',
  ngo: 'NGO',
  volunteer: 'Volunteer / NGO Transporter',
  admin: 'Admin',
  csr_sponsor: 'CSR Sponsor',
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, refetch } = useCurrentUser();
  const { logout } = useAuth();

  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameNotice, setNameNotice] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setNameDraft(user.name ?? '');
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="ui-page">
        <div className="ui-card ui-card-body animate-pulse">
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  async function saveName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameNotice(null);
    setNameError(null);
    const trimmed = nameDraft.trim();
    if (!trimmed) return setNameError('Please enter your name.');
    if (trimmed.length < 2 || trimmed.length > 80) {
      return setNameError('Name must be between 2 and 80 characters.');
    }
    setNameSaving(true);
    try {
      await updateAuthMe({ name: trimmed });
      await refetch();
      setNameNotice('Name saved.');
    } catch (err) {
      setNameError(errorMessage(err, 'Name could not be saved. Please try again.'));
    } finally {
      setNameSaving(false);
    }
  }

  async function saveEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailNotice(null);
    setEmailError(null);
    const trimmed = emailDraft.trim();
    if (!trimmed) return setEmailError('Please enter your email address.');
    if (!EMAIL_RE.test(trimmed)) {
      return setEmailError('Please enter a valid email address, such as name@example.com.');
    }
    if (trimmed.toLowerCase() === (user?.email ?? '').toLowerCase()) {
      return setEmailError('This is already your email address.');
    }
    setEmailSaving(true);
    try {
      await updateAuthMe({ email: trimmed });
      await refetch();
      setEmailDraft('');
      setEmailNotice('Email saved.');
    } catch (err) {
      setEmailError(
        errorMessage(err, 'Email could not be saved. It may already be used by another account.'),
      );
    } finally {
      setEmailSaving(false);
    }
  }

  async function signOut() {
    try {
      await createAuthLogout({});
    } catch {
      // Session cleanup is best-effort; the local session is cleared regardless.
    }
    logout();
    router.push('/');
  }

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div data-nexen-component="nx_app_profile_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-99236b1e-0">Profile</h1>
          <p className="ui-meta" data-nexen-id="nx-99236b1e-1">These details belong to your signed-in account.</p>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-99236b1e-2">
        <div className="ui-card">
          <div className="ui-card-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="ui-row min-w-0">
              <span className="ui-avatar" data-nexen-id="nx-99236b1e-3">{initialsOf(user.name)}</span>
              <h3 className="min-w-0 break-words" data-nexen-id="nx-99236b1e-4">{user.name}</h3>
            </div>
            <span className="ui-badge ui-badge-neutral" data-nexen-id="nx-99236b1e-5">{roleLabel}</span>
          </div>
          <div className="ui-card-body">
            <dl className="ui-kv" data-nexen-id="nx-99236b1e-6">
              <dt data-nexen-id="nx-99236b1e-7">Name</dt>
              <dd className="flex flex-wrap items-center gap-2 break-words" data-nexen-id="nx-99236b1e-8">
                <span className="min-w-0 break-words" data-nexen-id="nx-99236b1e-9">{user.name}</span>
                <button
                  className="ui-btn ui-btn-ghost ui-btn-sm"
                  type="button"
                  onClick={() => nameRef.current?.focus()}
                 data-nexen-id="nx-99236b1e-10">
                  Edit
                </button>
              </dd>
              <dt data-nexen-id="nx-99236b1e-11">Email</dt>
              <dd className="flex flex-wrap items-center gap-2 break-all" data-nexen-id="nx-99236b1e-12">
                <span className="min-w-0 break-all" data-nexen-id="nx-99236b1e-13">{user.email}</span>
                <button
                  className="ui-btn ui-btn-ghost ui-btn-sm"
                  type="button"
                  onClick={() => emailRef.current?.focus()}
                 data-nexen-id="nx-99236b1e-14">
                  Edit
                </button>
              </dd>
              <dt data-nexen-id="nx-99236b1e-15">Role</dt>
              <dd data-nexen-id="nx-99236b1e-16">{roleLabel}</dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-99236b1e-17">
        <div className="ui-grid ui-grid-2">
          <div className="ui-card min-w-0">
            <div className="ui-card-header">
              <h3 data-nexen-id="nx-99236b1e-18">Change name</h3>
            </div>
            <div className="ui-card-body">
              <form className="ui-form" onSubmit={saveName} noValidate data-nexen-id="nx-99236b1e-19">
                <label className="ui-field" data-nexen-id="nx-99236b1e-20">
                  <span data-nexen-id="nx-99236b1e-21">Name</span>
                  <input
                    ref={nameRef}
                    className="ui-input w-full min-w-0"
                    type="text"
                    name="name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                   data-nexen-id="nx-99236b1e-22"/>
                </label>
                {nameError && <p className="text-destructive text-sm" data-nexen-id="nx-99236b1e-23">{nameError}</p>}
                {nameNotice && <p className="text-success text-sm" data-nexen-id="nx-99236b1e-24">{nameNotice}</p>}
                <div className="ui-actions">
                  <button className="ui-btn ui-btn-primary" type="submit" disabled={nameSaving} data-nexen-id="nx-99236b1e-25">
                    {nameSaving ? 'Saving…' : 'Save name'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="ui-card min-w-0">
            <div className="ui-card-header">
              <h3 data-nexen-id="nx-99236b1e-26">Change email</h3>
            </div>
            <div className="ui-card-body">
              <form className="ui-form" onSubmit={saveEmail} noValidate data-nexen-id="nx-99236b1e-27">
                <label className="ui-field" data-nexen-id="nx-99236b1e-28">
                  <span data-nexen-id="nx-99236b1e-29">New email</span>
                  <input
                    ref={emailRef}
                    className="ui-input w-full min-w-0"
                    type="email"
                    name="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                   data-nexen-id="nx-99236b1e-30"/>
                </label>
                {emailError && <p className="text-destructive text-sm" data-nexen-id="nx-99236b1e-31">{emailError}</p>}
                {emailNotice && <p className="text-success text-sm" data-nexen-id="nx-99236b1e-32">{emailNotice}</p>}
                <div className="ui-actions">
                  <button className="ui-btn ui-btn-primary" type="submit" disabled={emailSaving} data-nexen-id="nx-99236b1e-33">
                    {emailSaving ? 'Saving…' : 'Save email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-99236b1e-34">
        <div className="ui-card">
          <div className="ui-card-header">
            <h3 data-nexen-id="nx-99236b1e-35">Change password</h3>
          </div>
          <div className="ui-card-body">
            <ChangePasswordForm />
          </div>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-99236b1e-36">
        <div className="ui-card">
          <div className="ui-card-header">
            <h3 data-nexen-id="nx-99236b1e-37">Sign out</h3>
          </div>
          <div className="ui-card-body">
            <p data-nexen-id="nx-99236b1e-38">End your session on this device.</p>
          </div>
          <div className="ui-card-footer">
            <button className="ui-btn ui-btn-danger" type="button" onClick={signOut} data-nexen-id="nx-99236b1e-39">
              Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}