'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createAuthForgotPassword } from '@/lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function validateEmail(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Please enter the email address on your account.';
    }
    if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) {
      return 'Enter a valid email address, such as name@example.com.';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateEmail(email);
    setFieldError(validation);
    setSubmitError(null);
    if (validation) return;

    setIsSubmitting(true);
    try {
      await createAuthForgotPassword({ email: email.trim() });
      setIsSent(true);
    } catch {
      setSubmitError('The reset link could not be sent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEmpty = email.trim().length === 0;

  return (
    <div data-nexen-component="nx_app_forgot_password_page" className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-d5936786-0">Forgot password</h1>
          <p className="ui-meta" data-nexen-id="nx-d5936786-1">We&apos;ll email a reset link to the address on your account.</p>
        </div>
      </div>

      <section className="ui-section" data-nexen-id="nx-d5936786-2">
        <div className="ui-stack">
          <div className="ui-card ui-card-lift">
            <div className="ui-card-body">
              <form className="ui-form" onSubmit={handleSubmit} noValidate data-nexen-id="nx-d5936786-3">
                <label className="ui-field" data-nexen-id="nx-d5936786-4">
                  <span data-nexen-id="nx-d5936786-5">Email</span>
                  <input
                    className="ui-input"
                    type="email"
                    name="email"
                    placeholder="Enter the email for your account"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (fieldError) setFieldError(null);
                    }}
                    disabled={isSubmitting}
                    aria-invalid={fieldError ? true : undefined}
                   data-nexen-id="nx-d5936786-6"/>
                  {fieldError ? (
                    <span className="ui-help" role="alert" data-nexen-id="nx-d5936786-7">
                      {fieldError}
                    </span>
                  ) : (
                    <span className="ui-help" data-nexen-id="nx-d5936786-8">Use the email address you signed up with</span>
                  )}
                </label>

                {submitError ? (
                  <p className="ui-help" role="alert" data-nexen-id="nx-d5936786-9">
                    {submitError}
                  </p>
                ) : null}

                {isSent ? (
                  <div className="ui-help" role="status">
                    If an account exists for that email, a reset link has been sent. Check your
                    inbox and follow the link to set a new password.
                  </div>
                ) : null}

                <div className="ui-actions">
                  <button
                    className={`ui-btn ui-btn-primary${isEmpty || isSubmitting ? ' is-disabled' : ''}`}
                    type="submit"
                    disabled={isEmpty || isSubmitting}
                   data-nexen-id="nx-d5936786-10">
                    {isSubmitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </div>
              </form>
            </div>
            <div className="ui-card-footer">
              <Link className="ui-link" href="/login" data-nexen-id="nx-d5936786-11">
                Back to sign in
              </Link>
              <p className="ui-help" data-nexen-id="nx-d5936786-12">
                Have the reset link from your email?{' '}
                <Link className="ui-link" href="/reset-password" data-nexen-id="nx-d5936786-13">
                  Reset link in the email
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}