import { test, expect, type APIResponse } from '@playwright/test';
import { apiAs } from './helpers';

async function ok(res: APIResponse, label: string) {
  expect(res.ok(), `${label}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json();
}

// Walks one donation through the whole rescue and checks the sponsor figure moves only
// once the NGO confirms receipt. It writes real rows (the description starts with "E2E").
test('donor → NGO → volunteer → NGO receipt → sponsor impact', async ({ baseURL }) => {
  const [donor, ngo, volunteer, sponsor] = await Promise.all(
    (['donor', 'ngo', 'volunteer', 'csr_sponsor'] as const).map((r) => apiAs(baseURL!, r)),
  );
  const PORTIONS = 4;

  const before = await ok(await sponsor.get('/api/impact-dashboard'), 'impact before');

  const { donation } = await ok(
    await donor.post('/api/my/donations', {
      data: {
        description: `E2E rescue ${new Date().toISOString()}`,
        portionsTotal: PORTIONS,
        pickupByAt: new Date(Date.now() + 4 * 3600_000).toISOString(),
        inputMethod: 'manual',
      },
    }),
    'create donation',
  );
  expect(donation.status).toBe('draft');

  await ok(
    await donor.post(`/api/my/donations/${donation.id}/handling-declarations`, {
      data: {
        preparationTimeMinutes: 30,
        preparedAt: new Date(Date.now() - 3600_000).toISOString(),
        storageMethod: 'hot_held',
        allergens: ['none'],
        checklistConfirmed: true,
      },
    }),
    'handling declaration',
  );

  const published = await ok(await donor.post(`/api/my/donations/${donation.id}/publish`), 'publish');
  expect(published.donation.status).toBe('published');

  // Publishing alone does not count as rescued.
  const mid = await ok(await sponsor.get('/api/impact-dashboard'), 'impact mid');
  expect(mid.confirmed_portions_delivered).toBe(before.confirmed_portions_delivered);

  const { claim } = await ok(
    await ngo.post(`/api/donations/${donation.id}/claims`, { data: { portions_claimed: PORTIONS } }),
    'claim',
  );
  await ok(await ngo.post(`/api/my/donation-claims/${claim.id}/confirm`), 'confirm claim');

  // Claiming more than is left must be refused (no over-allocation).
  const over = await ngo.post(`/api/donations/${donation.id}/claims`, { data: { portions_claimed: 1 } });
  expect(over.ok()).toBeFalsy();

  const open = await ok(await volunteer.get('/api/pickup-tasks/open'), 'open tasks');
  const tasks: any[] = Array.isArray(open) ? open : (open.pickupTasks ?? open.tasks ?? []);
  const task = tasks.find((t) => t.donationId === donation.id);
  expect(task, 'a pickup task exists for the claimed donation').toBeTruthy();

  await ok(await volunteer.post(`/api/pickup-tasks/${task.id}/accept`), 'accept');
  await ok(await volunteer.post(`/api/my/pickup-tasks/${task.id}/collect`), 'collect');

  // The NGO cannot confirm receipt before the handover.
  const early = await ngo.post(`/api/my/donation-claims/${claim.id}/confirm-receipt`, {
    data: { confirmed_portions: PORTIONS },
  });
  expect(early.ok()).toBeFalsy();

  await ok(await volunteer.post(`/api/my/pickup-tasks/${task.id}/handover`), 'handover');
  await ok(
    await ngo.post(`/api/my/donation-claims/${claim.id}/confirm-receipt`, { data: { confirmed_portions: PORTIONS } }),
    'receipt',
  );

  const final = await ok(await donor.get(`/api/my/donations/${donation.id}`), 'donation');
  expect((final.donation ?? final).status).toBe('received');

  const after = await ok(await sponsor.get('/api/impact-dashboard'), 'impact after');
  expect(after.confirmed_portions_delivered).toBe(before.confirmed_portions_delivered + PORTIONS);
  expect(after.estimated_waste_avoided_kg).toBeCloseTo(
    after.confirmed_portions_delivered * after.assumptions.kg_per_portion,
    2,
  );
});
