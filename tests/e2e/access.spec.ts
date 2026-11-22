import { test, expect } from '@playwright/test';
import { anonymous, apiAs } from './helpers';

test.describe('server-side permissions', () => {
  test('signed-out requests are rejected', async ({ baseURL }) => {
    const api = await anonymous(baseURL!);
    for (const path of ['/api/my/donations', '/api/admin/donations', '/api/pickup-tasks/open', '/api/impact-dashboard']) {
      expect((await api.get(path)).status(), path).toBe(401);
    }
  });

  test('admin-only endpoints reject every other role', async ({ baseURL }) => {
    for (const role of ['donor', 'ngo', 'volunteer', 'csr_sponsor'] as const) {
      const api = await apiAs(baseURL!, role);
      for (const path of ['/api/admin/donations', '/api/admin/users', '/api/admin/operations-summary']) {
        expect((await api.get(path)).status(), `${role} ${path}`).toBe(403);
      }
    }
  });

  test('admin can read the operations endpoints', async ({ baseURL }) => {
    const api = await apiAs(baseURL!, 'admin');
    for (const path of ['/api/admin/donations', '/api/admin/users', '/api/admin/operations-summary']) {
      expect((await api.get(path)).status(), path).toBe(200);
    }
  });

  test('only an NGO can claim, and only a donor can post', async ({ baseURL }) => {
    const donor = await apiAs(baseURL!, 'donor');
    const volunteer = await apiAs(baseURL!, 'volunteer');
    const noClaim = await donor.post('/api/donations/00000000-0000-4000-8000-000000000000/claims', {
      data: { portions_claimed: 1 },
    });
    expect(noClaim.status()).toBe(403);
    const noPost = await volunteer.post('/api/my/donations', { data: { description: 'x', portionsTotal: 1 } });
    expect(noPost.status()).not.toBe(201);
    expect(noPost.ok()).toBeFalsy();
  });

  test('donation input is validated on the server', async ({ baseURL }) => {
    const donor = await apiAs(baseURL!, 'donor');
    const past = new Date(Date.now() - 3600_000).toISOString();
    const bad = [
      { body: {}, msg: /Description is required/ },
      { body: { description: 'x', portionsTotal: 0 }, msg: /Portions/ },
      { body: { description: 'x', portionsTotal: 3, pickupByAt: past }, msg: /future/ },
    ];
    for (const { body, msg } of bad) {
      const res = await donor.post('/api/my/donations', { data: body });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toMatch(msg);
    }
  });
});
