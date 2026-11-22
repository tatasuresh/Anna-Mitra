import { test, expect } from '@playwright/test';
import { apiAs } from './helpers';

test.describe('settings', () => {
  test('only an admin can change a setting, and values are validated', async ({ baseURL }) => {
    const ngo = await apiAs(baseURL!, 'ngo');
    const admin = await apiAs(baseURL!, 'admin');
    expect((await ngo.patch('/api/admin/settings/kg_per_portion', { data: { value: 0.4 } })).status()).toBe(403);
    expect((await admin.patch('/api/admin/settings/kg_per_portion', { data: { value: 0 } })).status()).toBe(400);
    expect((await admin.patch('/api/admin/settings/kg_per_portion', { data: { value: 'abc' } })).status()).toBe(400);
    expect((await admin.patch('/api/admin/settings/reservation_timeout_minutes', { data: { value: 2.5 } })).status()).toBe(400);
    expect((await admin.patch('/api/admin/settings/not_a_setting', { data: { value: 1 } })).status()).toBe(404);
  });

  test('a saved kg-per-portion value is stored and drives the sponsor figures', async ({ baseURL }) => {
    const admin = await apiAs(baseURL!, 'admin');
    const sponsor = await apiAs(baseURL!, 'csr_sponsor');
    const read = async () => {
      const { settings } = await (await admin.get('/api/settings')).json();
      return settings.find((s: any) => s.key === 'kg_per_portion').value as number;
    };
    const original = await read();
    try {
      const res = await admin.patch('/api/admin/settings/kg_per_portion', { data: { value: 0.5 } });
      expect(res.ok(), await res.text()).toBeTruthy();
      expect(await read()).toBe(0.5);
      const impact = await (await sponsor.get('/api/impact-dashboard')).json();
      expect(impact.assumptions.kg_per_portion).toBe(0.5);
      expect(impact.estimated_waste_avoided_kg).toBeCloseTo(impact.confirmed_portions_delivered * 0.5, 2);
    } finally {
      await admin.patch('/api/admin/settings/kg_per_portion', { data: { value: original } });
    }
    expect(await read()).toBe(original);
  });
});

test.describe('donation rules', () => {
  test('a donation nobody claims expires after its pickup-by time, with a status event', async ({ baseURL }) => {
    test.setTimeout(60_000);
    const donor = await apiAs(baseURL!, 'donor');
    const created = await donor.post('/api/my/donations', {
      data: {
        description: `E2E expiry ${new Date().toISOString()}`,
        portionsTotal: 3,
        pickupByAt: new Date(Date.now() + 4_000).toISOString(),
        inputMethod: 'manual',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const { donation } = await created.json();
    const declared = await donor.post(`/api/my/donations/${donation.id}/handling-declarations`, {
      data: {
        preparationTimeMinutes: 20,
        preparedAt: new Date(Date.now() - 1800_000).toISOString(),
        storageMethod: 'hot_held',
        allergens: ['none'],
        checklistConfirmed: true,
      },
    });
    expect(declared.ok(), await declared.text()).toBeTruthy();
    const published = await donor.post(`/api/my/donations/${donation.id}/publish`);
    expect(published.ok(), await published.text()).toBeTruthy();

    await new Promise((r) => setTimeout(r, 6_000));

    const after = await (await donor.get(`/api/my/donations/${donation.id}`)).json();
    expect((after.donation ?? after).status).toBe('expired');
    const events = await (await donor.get(`/api/donations/${donation.id}/status-events`)).json();
    const list: any[] = Array.isArray(events) ? events : (events.statusEvents ?? events.events ?? []);
    expect(list.some((e) => e.toStatus === 'expired')).toBeTruthy();

    // An NGO can no longer see or claim it.
    const ngo = await apiAs(baseURL!, 'ngo');
    const feed = await (await ngo.get('/api/donations/eligible')).json();
    expect(feed.donations.some((x: any) => x.donation.id === donation.id)).toBeFalsy();
    const claim = await ngo.post(`/api/donations/${donation.id}/claims`, { data: { portions_claimed: 1 } });
    expect(claim.ok()).toBeFalsy();
  });

  test('donations from restaurants that are not approved are never offered or claimable', async ({ baseURL }) => {
    const admin = await apiAs(baseURL!, 'admin');
    const ngo = await apiAs(baseURL!, 'ngo');

    const restaurants = (await (await admin.get('/api/admin/restaurants')).json()).restaurants as any[];
    const notApproved = new Set(restaurants.filter((r) => r.status !== 'approved').map((r) => r.id));
    expect(notApproved.size, 'sample data has restaurants awaiting approval').toBeGreaterThan(0);

    const feed = await (await ngo.get('/api/donations/eligible')).json();
    for (const item of feed.donations) {
      expect(notApproved.has(item.donation.restaurantId), `feed offers ${item.donation.description}`).toBeFalsy();
    }

    const all = (await (await admin.get('/api/admin/donations')).json()).donations as any[];
    const blocked = all.find((d) => notApproved.has(d.restaurantId) && d.portionsRemaining > 0);
    test.skip(!blocked, 'no donation from an unapproved restaurant to try');
    const res = await ngo.post(`/api/donations/${blocked!.id}/claims`, { data: { portions_claimed: 1 } });
    expect(res.status()).toBe(403);
  });
});

test.describe('claiming', () => {
  test('an NGO can reserve part of a seeded donation and release it again', async ({ baseURL }) => {
    const ngo = await apiAs(baseURL!, 'ngo');
    const feed = await (await ngo.get('/api/donations/eligible')).json();
    test.skip(feed.donations.length === 0, 'nothing is open for claiming right now');
    const target = feed.donations[0].donation;

    const res = await ngo.post(`/api/donations/${target.id}/claims`, { data: { portions_claimed: 1 } });
    expect(res.status(), await res.text()).toBe(201);
    const { claim } = await res.json();
    try {
      const after = await (await ngo.get('/api/donations/eligible')).json();
      const seen = after.donations.find((x: any) => x.donation.id === target.id);
      expect(seen.donation.portionsRemaining).toBe(target.portionsRemaining - 1);
    } finally {
      const released = await ngo.post(`/api/my/donation-claims/${claim.id}/release`);
      expect(released.ok(), await released.text()).toBeTruthy();
    }
    const back = await (await ngo.get('/api/donations/eligible')).json();
    expect(back.donations.find((x: any) => x.donation.id === target.id).donation.portionsRemaining).toBe(
      target.portionsRemaining,
    );
  });
});

test.describe('sample data', () => {
  test('pickup tasks only carry a failure reason and timestamps their status allows', async ({ baseURL }) => {
    const admin = await apiAs(baseURL!, 'admin');
    const res = await admin.get('/api/admin/pickup-tasks');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const tasks: any[] = Array.isArray(body) ? body : (body.pickupTasks ?? body.tasks ?? []);
    expect(tasks.length).toBeGreaterThan(0);
    for (const t of tasks) {
      if (t.status !== 'failed') expect(t.failureReason ?? null, `task ${t.id} (${t.status})`).toBeNull();
      if (t.status === 'open') expect(t.collectedAt ?? null, `open task ${t.id}`).toBeNull();
      if (t.status === 'accepted' || t.status === 'open') expect(t.handedOverAt ?? null, `${t.status} task ${t.id}`).toBeNull();
    }
  });
});
