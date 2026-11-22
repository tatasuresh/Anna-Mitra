'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthResetPassword } from '@/lib/api';

type ResetPasswordPageProps = {
  searchParams?: { token?: string };
};

type FieldErrors = { password?: string; confirm?: string };

function validatePasswords(password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!password) {
    errors.password = 'Please enter a new password.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (!confirm) {
    errors.confirm = 'Please confirm your new password.';
  } else if (confirm !== password) {
    errors.confirm = 'Passwords do not match.';
  }
  return errors;
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams?.token ?? '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validatePasswords(password, confirm);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!token) {
      setFormError('This reset link is missing its token. Request a new reset link.');
      return;
    }

    setIsSaving(true);
    try {
      await createAuthResetPassword({ token, password });
      router.push('/login');
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : 'This link is invalid or has expired. Request a new reset link.',
      );
      setIsSaving(false);
    }
  }

  if (!token) {
    return (
      <div className="ui-page">
        <div className="ui-page-header">
          <div>
            <h1 data-nexen-id="nx-5beb24c0-0">Set a new password</h1>
            <p className="ui-meta" data-nexen-id="nx-5beb24c0-1">This reset link is missing.</p>
          </div>
        </div>
        <section className="ui-section" data-nexen-id="nx-5beb24c0-2">
          <div className="ui-card">
            <div className="ui-card-body ui-stack">
              <p className="ui-meta" data-nexen-id="nx-5beb24c0-3">
                The link you opened does not include a reset token. Open the link from your email, or request a new one.
              </p>
              <Link className="ui-link" href="/forgot-password" data-nexen-id="nx-5beb24c0-4">
                Request a new reset link
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div data-nexen-component="nx_app_reset_password_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-5beb24c0-5">Set a new password</h1>
          <p className="ui-meta" data-nexen-id="nx-5beb24c0-6">Your password will be changed for this account.</p>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-5beb24c0-7">
        <div className="ui-card ui-card-lifted">
          <div className="ui-card-body">
            {formError && (
              <p role="alert" className="ui-meta text-[hsl(var(--destructive))]" data-nexen-id="nx-5beb24c0-8">
                {formError}
              </p>
            )}
            <form className="ui-form" onSubmit={handleSubmit} noValidate data-nexen-id="nx-5beb24c0-9">
              <label className="ui-field" data-nexen-id="nx-5beb24c0-10">
                <span data-nexen-id="nx-5beb24c0-11">New password</span>
                <input
                  className="ui-input"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                 data-nexen-id="nx-5beb24c0-12"/>
                {fieldErrors.password && (
                  <span className="ui-meta text-[hsl(var(--destructive))]" data-nexen-id="nx-5beb24c0-13">{fieldErrors.password}</span>
                )}
              </label>
              <label className="ui-field" data-nexen-id="nx-5beb24c0-14">
                <span data-nexen-id="nx-5beb24c0-15">Confirm new password</span>
                <input
                  className="ui-input"
                  type="password"
                  name="password_confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                 data-nexen-id="nx-5beb24c0-16"/>
                {fieldErrors.confirm && (
                  <span className="ui-meta text-[hsl(var(--destructive))]" data-nexen-id="nx-5beb24c0-17">{fieldErrors.confirm}</span>
                )}
              </label>
              <div className="ui-actions">
                <button className="ui-btn ui-btn-primary" type="submit" disabled={isSaving} data-nexen-id="nx-5beb24c0-18">
                  {isSaving ? 'Saving…' : 'Save new password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="ui-section" data-nexen-id="nx-5beb24c0-19">
        <div className="ui-stack">
          <p className="ui-meta" data-nexen-id="nx-5beb24c0-20">Link expired, already used, or not working?</p>
          <Link className="ui-link" href="/forgot-password" data-nexen-id="nx-5beb24c0-21">
            Request a new reset link
          </Link>
          <Link className="ui-link" href="/login" data-nexen-id="nx-5beb24c0-22">
            Back to sign in
          </Link>
        </div>
      </section>
    </div>
  );
}