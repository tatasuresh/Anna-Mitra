import { request, type APIRequestContext } from '@playwright/test';

export type Role = 'donor' | 'ngo' | 'volunteer' | 'admin' | 'csr_sponsor';

export const ROLE_HOME: Record<Role, string> = {
  donor: '/donor-dashboard',
  ngo: '/ngo-feed',
  volunteer: '/volunteer-tasks',
  admin: '/admin-operations',
  csr_sponsor: '/sponsor-impact',
};

/** An API client signed in as the seeded demo account for a role (cookie kept in the context). */
export async function apiAs(baseURL: string, role: Role): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/auth/demo-sign-in', { data: { role } });
  if (!res.ok()) throw new Error(`demo sign-in as ${role} failed: ${res.status()}`);
  return ctx;
}

export async function anonymous(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL });
}
