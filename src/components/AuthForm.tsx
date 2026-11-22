'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  createAuthForgotPassword,
  createAuthLogin,
  createAuthRegister,
  createAuthResetPassword,
} from '@/lib/api';
import type { User } from '@/types/user';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

interface AuthFormProps {
  mode?: AuthMode;
  role?: string;
  token?: string;
  submitLabel?: string;
}

const ROLE_HOME: Record<string, string> = {
  donor: '/donor-dashboard',
  ngo: '/ngo-feed',
  volunteer: '/volunteer-tasks',
  admin: '/admin-operations',
  csr_sponsor: '/sponsor-impact',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_LABELS: Record<AuthMode, string> = {
  login: 'Sign in',
  signup: 'Create account',
  forgot: 'Send reset link',
  reset: 'Set new password',
};

const inputClass =
  'w-full min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground';

function validate(
  mode: AuthMode,
  values: { name: string; email: string; password: string },
  role?: string,
): string | null {
  const { name, email, password } = values;
  if (mode === 'signup') {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return 'Please enter your name (2 to 80 characters).';
    }
    if (!role) return 'Please choose how you will use Anna Mitra.';
  }
  if (mode !== 'reset') {
    if (!email.trim()) {
      return mode === 'login'
        ? 'Enter your email address to sign in.'
        : 'Please enter a valid email address.';
    }
    if (email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return 'Enter a valid email address, such as name@example.com.';
    }
  }
  if (mode === 'login') {
    if (!password) return 'Enter your password to sign in.';
    if (password.length > 128) return 'Password must be 128 characters or fewer.';
  }
  if (mode === 'signup' || mode === 'reset') {
    if (!password) return 'Please enter a password.';
    if (password.length < 8 || password.length > 72) {
      return 'Password must be between 8 and 72 characters.';
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return 'Password must include at least one letter and one number.';
    }
  }
  return null;
}

export default function AuthForm({
  mode = 'login',
  role,
  token,
  submitLabel,
}: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showName = mode === 'signup';
  const showEmail = mode !== 'reset';
  const showPassword = mode !== 'forgot';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const message = validate(mode, { name, email, password }, role);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        const user: User = await createAuthLogin({ email: email.trim(), password });
        router.push(ROLE_HOME[user.role] ?? '/');
      } else if (mode === 'signup') {
        await createAuthRegister({
          name: name.trim(),
          email: email.trim(),
          password,
          role: role as string,
        });
        setInfo('Account created. An admin will review it before sign-in works.');
      } else if (mode === 'forgot') {
        await createAuthForgotPassword({ email: email.trim() });
        setInfo('If an account exists for that email, a reset link is on its way.');
      } else {
        if (!token) {
          setError('This reset link is invalid.');
          return;
        }
        await createAuthResetPassword({ token, password });
        setInfo('Your password has been reset. You can sign in now.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form data-nexen-component="nx_components_AuthForm" onSubmit={handleSubmit} noValidate className="flex w-full max-w-md flex-col gap-4" data-nexen-id="nx-062785df-0">
      {showName && (
        <label className="flex flex-col gap-1 text-sm text-foreground" data-nexen-id="nx-062785df-1">
          <span data-nexen-id="nx-062785df-2">Full name</span>
          <input
            className={inputClass}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
           data-nexen-id="nx-062785df-3"/>
        </label>
      )}
      {showEmail && (
        <label className="flex flex-col gap-1 text-sm text-foreground" data-nexen-id="nx-062785df-4">
          <span data-nexen-id="nx-062785df-5">Email</span>
          <input
            className={inputClass}
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@organisation.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
           data-nexen-id="nx-062785df-6"/>
        </label>
      )}
      {showPassword && (
        <label className="flex flex-col gap-1 text-sm text-foreground" data-nexen-id="nx-062785df-7">
          <span data-nexen-id="nx-062785df-8">{mode === 'reset' ? 'New password' : 'Password'}</span>
          <input
            className={inputClass}
            type="password"
            name="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
           data-nexen-id="nx-062785df-9"/>
          {(mode === 'signup' || mode === 'reset') && (
            <span className="text-xs text-muted" data-nexen-id="nx-062785df-10">
              Use a strong password you do not use elsewhere
            </span>
          )}
        </label>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
       data-nexen-id="nx-062785df-11">
        {busy ? 'Please wait…' : submitLabel ?? DEFAULT_LABELS[mode]}
      </button>
      <div aria-live="polite" className="min-h-[1.25rem] text-sm">
        {error && <p className="text-destructive" data-nexen-id="nx-062785df-12">{error}</p>}
        {info && <p className="text-foreground" data-nexen-id="nx-062785df-13">{info}</p>}
      </div>
    </form>
  );
}