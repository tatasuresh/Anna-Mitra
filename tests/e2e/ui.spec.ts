import { test, expect } from '@playwright/test';
import { ROLE_HOME, type Role } from './helpers';

test.describe('styling and layout', () => {
  test('the component stylesheet is active', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toHaveClass(/ui-root/);
    // .ui-page only has padding when the .ui-root rules apply.
    const padding = await page.locator('.ui-page').first().evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(parseFloat(padding)).toBeGreaterThan(0);
    // The sign-in button is a styled primary button, not a bare browser button.
    const bg = await page.getByRole('button', { name: 'Sign in' }).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('pages do not scroll sideways', async ({ page }) => {
    for (const path of ['/', '/login', '/signup']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });
});

test('unknown pages show a real not-found page', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByText(/coming soon|generating/i)).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to role entry' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test.describe('role entry', () => {
  test('shows the five roles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Choose your role' })).toBeVisible();
    for (const role of Object.keys(ROLE_HOME)) {
      await expect(page.locator(`[data-role="${role}"]`)).toBeVisible();
    }
  });

  for (const role of Object.keys(ROLE_HOME) as Role[]) {
    test(`instant demo sign-in as ${role} opens ${ROLE_HOME[role]}`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`[data-role="${role}"] button`).first().click();
      await page.locator(`[data-role="${role}"]`).getByRole('button', { name: 'Enter demo' }).click();
      await expect(page).toHaveURL(new RegExp(`${ROLE_HOME[role]}$`));
      await expect(page.getByText('not available for your role')).toHaveCount(0);
      await expect(page.locator('main h1, main h2').first()).toBeVisible();
    });
  }
});

test.describe('navigation', () => {
  test('the mobile menu toggles, and the sidebar is always shown on desktop', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.locator('[data-role="admin"] button').first().click();
    await page.locator('[data-role="admin"]').getByRole('button', { name: 'Enter demo' }).click();
    await expect(page).toHaveURL(/admin-operations/);
    const link = page.getByRole('link', { name: 'Users', exact: true });
    if (isMobile) {
      await expect(link).toBeHidden();
      await page.getByRole('button', { name: 'Toggle menu' }).click();
      await expect(link).toBeVisible();
    } else {
      await expect(link).toBeVisible();
    }
  });

  test('email and password sign-in rejects a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('donor@example.com');
    await page.getByLabel('Password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('quick post', () => {
  async function openQuickPost(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.locator('[data-role="donor"] button').first().click();
    await page.locator('[data-role="donor"]').getByRole('button', { name: 'Enter demo' }).click();
    await expect(page).toHaveURL(/donor-dashboard/);
    await page.goto('/quick-post');
    await expect(page.getByRole('heading', { name: 'Quick Post' })).toBeVisible();
  }

  test('a described donation fills the form, and every value stays editable', async ({ page }) => {
    const tomorrow = new Date(Date.now() + 24 * 3600_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const pickup = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T21:00`;
    await page.route('**/api/my/donation-extractions', (route) =>
      route.fulfill({
        json: { available: true, ai_extracted: true, description: 'Vegetable pulao and raita', portions_total: 30, pickup_by_local: pickup },
      }),
    );
    await openQuickPost(page);
    await page.getByPlaceholder(/vegetable pulao and raita, pick up/i).fill('30 portions of pulao, collect by 9 pm tomorrow');
    await page.getByRole('button', { name: 'Fill the form' }).click();
    await expect(page.getByText('Filled from your description')).toBeVisible();
    await expect(page.locator('input[name="description"]')).toHaveValue('Vegetable pulao and raita');
    await expect(page.locator('input[name="portions"]')).toHaveValue('30');
    await expect(page.locator('input[name="pickupBy"]')).toHaveValue(pickup);
    await page.locator('input[name="portions"]').fill('25');
    await expect(page.locator('input[name="portions"]')).toHaveValue('25');
  });

  test('when the AI is unavailable the donor is told and can still enter values by hand', async ({ page }) => {
    await page.route('**/api/my/donation-extractions', (route) =>
      route.fulfill({ json: { available: false, ai_extracted: false, reason: 'not_configured' } }),
    );
    await openQuickPost(page);
    await page.getByPlaceholder(/vegetable pulao and raita, pick up/i).fill('some rice');
    await page.getByRole('button', { name: 'Fill the form' }).click();
    await expect(page.getByText('AI extraction is unavailable')).toBeVisible();
    await page.locator('input[name="description"]').fill('Steamed rice');
    await expect(page.locator('input[name="description"]')).toHaveValue('Steamed rice');
  });

  test('an unclear description asks for more detail and keeps what was typed', async ({ page }) => {
    await page.route('**/api/my/donation-extractions', (route) =>
      route.fulfill({ json: { available: true, ai_extracted: false, reason: 'unclear' } }),
    );
    await openQuickPost(page);
    await page.locator('input[name="description"]').fill('Keep me');
    await page.getByPlaceholder(/vegetable pulao and raita, pick up/i).fill('hmm');
    await page.getByRole('button', { name: 'Fill the form' }).click();
    await expect(page.getByText(/could not find the food, portions or pickup time/i)).toBeVisible();
    await expect(page.locator('input[name="description"]')).toHaveValue('Keep me');
  });
});
