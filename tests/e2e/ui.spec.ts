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
