'use client';

import { useState, type FormEvent } from 'react';
import { createAuthChangePassword } from '@/lib/api';

type FieldKey = 'current' | 'next' | 'confirm';
type FieldErrors = Partial<Record<FieldKey, string>>;

const inputClass =
  'mt-1 w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function validate(current: string, next: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!current) {
    errors.current = 'Please enter your current password.';
  }

  if (!next) {
    errors.next = 'Please enter a new password.';
  } else if (next.length < 8 || next.length > 72) {
    errors.next = 'Password must be between 8 and 72 characters.';
  } else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    errors.next = 'Password must include at least one letter and one number.';
  }

  if (!confirm) {
    errors.confirm = 'Please confirm your new password.';
  } else if (confirm !== next) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
}

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const fieldErrors = validate(currentPassword, newPassword, confirmPassword);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await createAuthChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Your password has been changed.');
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : 'We could not change your password. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form data-nexen-component="nx_components_ChangePasswordForm" onSubmit={handleSubmit} noValidate className="flex w-full min-w-0 flex-col gap-4" data-nexen-id="nx-539ea49f-0">
      <div className="min-w-0">
        <label htmlFor="current-password" className="block text-sm font-medium text-foreground" data-nexen-id="nx-539ea49f-1">
          Current password
        </label>
        <input
          id="current-password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.current)}
          aria-describedby={errors.current ? 'current-password-error' : undefined}
         data-nexen-id="nx-539ea49f-2"/>
        {errors.current && (
          <p id="current-password-error" className="mt-1 text-sm text-destructive" data-nexen-id="nx-539ea49f-3">
            {errors.current}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <label htmlFor="new-password" className="block text-sm font-medium text-foreground" data-nexen-id="nx-539ea49f-4">
          New password
        </label>
        <input
          id="new-password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.next)}
          aria-describedby={errors.next ? 'new-password-error' : undefined}
         data-nexen-id="nx-539ea49f-5"/>
        {errors.next && (
          <p id="new-password-error" className="mt-1 text-sm text-destructive" data-nexen-id="nx-539ea49f-6">
            {errors.next}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground" data-nexen-id="nx-539ea49f-7">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
         data-nexen-id="nx-539ea49f-8"/>
        {errors.confirm && (
          <p id="confirm-password-error" className="mt-1 text-sm text-destructive" data-nexen-id="nx-539ea49f-9">
            {errors.confirm}
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground" data-nexen-id="nx-539ea49f-10">Enter your current password to make a change.</p>

      {formError && (
        <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-539ea49f-11">
          {formError}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-success" data-nexen-id="nx-539ea49f-12">
          {successMessage}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60 sm:w-auto"
         data-nexen-id="nx-539ea49f-13">
          {isSubmitting ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}