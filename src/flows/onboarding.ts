'use client';

export type OnboardingRole = 'donor' | 'ngo' | 'volunteer' | 'admin' | 'csr_sponsor';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface OnboardingProgress {
  completed: number;
  total: number;
  percent: number;
}

const ONBOARDING_ROLES: readonly OnboardingRole[] = [
  'donor',
  'ngo',
  'volunteer',
  'admin',
  'csr_sponsor',
];

const ONBOARDING_STEPS: Record<OnboardingRole, readonly OnboardingStep[]> = {
  donor: [
    {
      id: 'donor-restaurant',
      title: 'Set up your restaurant',
      description: 'Add your restaurant name and pickup address so NGOs know where to collect.',
      href: '/restaurant-preferences',
    },
    {
      id: 'donor-preferences',
      title: 'Save your defaults',
      description: 'Choose default portions and a preferred pickup window to speed up posting.',
      href: '/restaurant-preferences',
    },
    {
      id: 'donor-first-post',
      title: 'Post your first donation',
      description: 'Describe surplus food, set portions and pickup-by time, then complete the checklist.',
      href: '/quick-post',
    },
  ],
  ngo: [
    {
      id: 'ngo-capacity',
      title: 'Set your capacity',
      description: 'Tell us how many portions you need and can store, and whether you are available.',
      href: '/ngo-capacity',
    },
    {
      id: 'ngo-feed',
      title: 'Review your feed',
      description: 'See eligible donations near you and the reasons each one matches.',
      href: '/ngo-feed',
    },
    {
      id: 'ngo-first-claim',
      title: 'Claim your first donation',
      description: 'Reserve the portions you can take within the confirmation window.',
      href: '/ngo-feed',
    },
  ],
  volunteer: [
    {
      id: 'volunteer-availability',
      title: 'Turn on availability',
      description: 'Mark yourself available and set how many portions you can carry.',
      href: '/volunteer-tasks',
    },
    {
      id: 'volunteer-accept',
      title: 'Accept a pickup',
      description: 'Choose an open pickup that fits your carrying capacity.',
      href: '/volunteer-tasks',
    },
    {
      id: 'volunteer-handover',
      title: 'Learn the handover steps',
      description: 'Confirm collection and handover with a single tap on Active Delivery.',
      href: '/active-delivery',
    },
  ],
  admin: [
    {
      id: 'admin-approvals',
      title: 'Review pending approvals',
      description: 'Approve or suspend participants waiting for access.',
      href: '/admin-operations',
    },
    {
      id: 'admin-rescues',
      title: 'Monitor active rescues',
      description: 'Watch claimed and picked-up donations and spot failed assignments.',
      href: '/admin-operations',
    },
  ],
  csr_sponsor: [
    {
      id: 'sponsor-campaign',
      title: 'Review your campaign',
      description: 'Check your campaign dates, cost per portion and recognition text.',
      href: '/sponsor-impact',
    },
    {
      id: 'sponsor-impact',
      title: 'Explore confirmed impact',
      description: 'See confirmed portions and clearly labelled estimates for your campaign.',
      href: '/sponsor-impact',
    },
  ],
};

export function isOnboardingRole(value: unknown): value is OnboardingRole {
  return typeof value === 'string' && (ONBOARDING_ROLES as readonly string[]).includes(value);
}

export function getOnboardingSteps(role: OnboardingRole): OnboardingStep[] {
  const steps = isOnboardingRole(role) ? ONBOARDING_STEPS[role] : [];
  return steps.map((step) => ({ ...step }));
}

export function getNextOnboardingStep(
  role: OnboardingRole,
  completedStepIds: readonly string[] | null | undefined,
): OnboardingStep | null {
  const completed = Array.isArray(completedStepIds) ? completedStepIds : [];
  const next = getOnboardingSteps(role).find((step) => !completed.includes(step.id));
  return next ?? null;
}

export function getOnboardingProgress(
  role: OnboardingRole,
  completedStepIds: readonly string[] | null | undefined,
): OnboardingProgress {
  const steps = getOnboardingSteps(role);
  const completed = Array.isArray(completedStepIds) ? completedStepIds : [];
  const total = steps.length;
  const done = steps.filter((step) => completed.includes(step.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { completed: done, total, percent };
}

export function isOnboardingComplete(
  role: OnboardingRole,
  completedStepIds: readonly string[] | null | undefined,
): boolean {
  const total = getOnboardingSteps(role).length;
  return total > 0 && getOnboardingProgress(role, completedStepIds).completed === total;
}