'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createAuthRegister } from '@/lib/api';
import { useAuth, type AuthUser } from '@/lib/auth';
import type { User } from '@/types/user';

type AccountType = 'donor' | 'ngo' | 'volunteer' | 'sponsor';
type FieldName = 'participantType' | 'name' | 'email' | 'password' | 'confirmation';
type FieldErrors = Partial<Record<FieldName, string>>;
type RegisterResponse = User & { token?: string | null };

const ACCOUNT_TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: 'donor', label: 'Donor', hint: 'Restaurant staff' },
  { value: 'ngo', label: 'NGO', hint: 'Charity or food-relief organisation' },
  { value: 'volunteer', label: 'Volunteer / NGO Transporter', hint: 'Collect and deliver food' },
  { value: 'sponsor', label: 'CSR Sponsor', hint: 'Fund and recognise rescued meals' },
];

// The API role enum stores the sponsor account as csr_sponsor.
const ROLE_BY_TYPE: Record<AccountType, string> = {
  donor: 'donor',
  ngo: 'ngo',
  volunteer: 'volunteer',
  sponsor: 'csr_sponsor',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: {
  accountType: AccountType | '';
  name: string;
  email: string;
  password: string;
  confirmation: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (!input.accountType) {
    errors.participantType = 'Please select whether you are a donor, NGO, volunteer or sponsor to continue.';
  }
  if (!name) {
    errors.name = 'Please enter your name.';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!input.password) {
    errors.password = 'Please choose a password.';
  } else if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (input.confirmation !== input.password) {
    errors.confirmation = 'Passwords do not match.';
  }
  return errors;
}

export default function SignUpPage() {
  const { login } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldErrors = validate({ accountType, name, email, password, confirmation });
    setErrors(fieldErrors);
    setFormError(null);
    if (Object.keys(fieldErrors).length > 0 || !accountType) return;

    setIsSubmitting(true);
    try {
      const created: RegisterResponse = await createAuthRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        role: ROLE_BY_TYPE[accountType],
      });
      // A pending account is never issued a session. Only if the server
      // hands back a token is the session stored through the auth provider.
      if (created.token) {
        const sessionUser: AuthUser = {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
        };
        login(created.token, sessionUser);
      }
      setIsPending(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create your account. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-nexen-component="nx_app_signup_page" className="ui-page min-w-0 w-full max-w-5xl mx-auto px-4">
      <div className="ui-page-header">
        <div>
          <h1 data-nexen-id="nx-85022a33-0">Create your Anna Mitra account</h1>
          <p className="ui-meta" data-nexen-id="nx-85022a33-1">Your account will be reviewed by an admin before it can be used.</p>
        </div>
      </div>

      {isPending ? (
        <div className="ui-alert ui-alert-info">
          Account created. It is pending admin approval, so sign-in will work once an admin approves it.{' '}
          <Link className="ui-link" href="/login" data-nexen-id="nx-85022a33-2">Back to log in</Link>
        </div>
      ) : (
        <div className="ui-row flex-col sm:flex-row items-stretch sm:items-start gap-6">
          <div className="ui-stack min-w-0 w-full sm:flex-[2]">
            <section className="ui-section" data-nexen-id="nx-85022a33-3">
              <h2 className="ui-section-title" data-nexen-id="nx-85022a33-4">Who is signing up?</h2>
              <div className="ui-grid ui-grid-2">
                {ACCOUNT_TYPES.map((option) => (
                  <label key={option.value} className="ui-card cursor-pointer" data-nexen-id="nx-85022a33-5">
                    <div className="ui-card-body">
                      <label className="ui-check" data-nexen-id="nx-85022a33-6">
                        <input
                          type="radio"
                          name="accountType"
                          value={option.value}
                          checked={accountType === option.value}
                          onChange={() => setAccountType(option.value)}
                         data-nexen-id="nx-85022a33-7"/>{' '}
                        <strong data-nexen-id="nx-85022a33-8">{option.label}</strong>
                      </label>
                      <p className="ui-meta" data-nexen-id="nx-85022a33-9">{option.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.participantType && <p className="ui-meta text-destructive" data-nexen-id="nx-85022a33-10">{errors.participantType}</p>}
            </section>

            <section className="ui-section" data-nexen-id="nx-85022a33-11">
              <h2 className="ui-section-title" data-nexen-id="nx-85022a33-12">Your details</h2>
              <div className="ui-card">
                <div className="ui-card-body">
                  <form className="ui-form" onSubmit={handleSubmit} noValidate data-nexen-id="nx-85022a33-13">
                    <label className="ui-field" data-nexen-id="nx-85022a33-14">
                      <span data-nexen-id="nx-85022a33-15">Full name</span>
                      <input
                        className="ui-input w-full"
                        type="text"
                        name="name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                       data-nexen-id="nx-85022a33-16"/>
                      {errors.name && <span className="ui-meta text-destructive" data-nexen-id="nx-85022a33-17">{errors.name}</span>}
                    </label>

                    <label className="ui-field" data-nexen-id="nx-85022a33-18">
                      <span data-nexen-id="nx-85022a33-19">Email</span>
                      <input
                        className="ui-input w-full"
                        type="email"
                        name="email"
                        placeholder="you@organisation.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                       data-nexen-id="nx-85022a33-20"/>
                      {errors.email && <span className="ui-meta text-destructive" data-nexen-id="nx-85022a33-21">{errors.email}</span>}
                    </label>

                    <label className="ui-field" data-nexen-id="nx-85022a33-22">
                      <span data-nexen-id="nx-85022a33-23">Password</span>
                      <input
                        className="ui-input w-full"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                       data-nexen-id="nx-85022a33-24"/>
                      <span className="ui-help" data-nexen-id="nx-85022a33-25">Use a strong password you do not use elsewhere</span>
                      {errors.password && <span className="ui-meta text-destructive" data-nexen-id="nx-85022a33-26">{errors.password}</span>}
                    </label>

                    <label className="ui-field" data-nexen-id="nx-85022a33-27">
                      <span data-nexen-id="nx-85022a33-28">Confirm password</span>
                      <input
                        className="ui-input w-full"
                        type="password"
                        name="confirmation"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                       data-nexen-id="nx-85022a33-29"/>
                      {errors.confirmation && <span className="ui-meta text-destructive" data-nexen-id="nx-85022a33-30">{errors.confirmation}</span>}
                    </label>

                    {formError && <div className="ui-alert ui-alert-danger">{formError}</div>}

                    <div className="ui-actions">
                      <button
                        className="ui-btn ui-btn-primary"
                        type="submit"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                       data-nexen-id="nx-85022a33-31">
                        {isSubmitting ? 'Creating account…' : 'Create account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <p className="ui-meta" data-nexen-id="nx-85022a33-32">
              Already have an account?{' '}
              <Link className="ui-link" href="/login" data-nexen-id="nx-85022a33-33">Log in</Link>
            </p>
          </div>

          <div className="ui-stack min-w-0 w-full sm:flex-1">
            <div className="ui-alert ui-alert-info">
              Pending approval: your account waits for admin approval before sign-in works. You will be told once it is approved.
            </div>
            <div className="ui-card">
              <div className="ui-card-body">
                <h3 data-nexen-id="nx-85022a33-34">What happens next</h3>
                <ol className="ui-timeline" data-nexen-id="nx-85022a33-35">
                  <li className="ui-timeline-item" data-nexen-id="nx-85022a33-36">
                    <span className="ui-timeline-time" data-nexen-id="nx-85022a33-37">Step 1</span>
                    <p data-nexen-id="nx-85022a33-38">Create your account with the form</p>
                  </li>
                  <li className="ui-timeline-item" data-nexen-id="nx-85022a33-39">
                    <span className="ui-timeline-time" data-nexen-id="nx-85022a33-40">Step 2</span>
                    <p data-nexen-id="nx-85022a33-41">An admin reviews and approves your account</p>
                  </li>
                  <li className="ui-timeline-item" data-nexen-id="nx-85022a33-42">
                    <span className="ui-timeline-time" data-nexen-id="nx-85022a33-43">Step 3</span>
                    <p data-nexen-id="nx-85022a33-44">Log in and start using Anna Mitra</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}