import { defineConfig, devices } from '@playwright/test';

// Tests run against a deployed app. Override with BASE_URL to target another one,
// e.g. BASE_URL=http://localhost:3000 npm run test:e2e
const baseURL = process.env.BASE_URL ?? 'https://anna-mitra-production.up.railway.app';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    // Browser tests run at phone and desktop widths.
    { name: 'ui-mobile', testMatch: /ui\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'ui-desktop', testMatch: /ui\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    // API tests are viewport independent, so they run once.
    { name: 'api', testMatch: /(access|flow)\.spec\.ts/ },
  ],
});
