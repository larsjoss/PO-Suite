import { defineConfig, devices } from '@playwright/test';

/**
 * Minimaler Playwright-Setup fuer Smoke-Tests.
 *
 * - Nur Chromium (CI-Footprint klein halten)
 * - vite preview als webServer mit base /PO-Suite/
 * - Tests in ./e2e/
 *
 * Auth-Vars (VITE_AUTH_EMAIL / VITE_AUTH_PASSWORD) muessen in einer
 * .env(.local) gesetzt sein — die Smoke-Tests brauchen sie nicht
 * fuer den minimalen Login-Page-Test, aber jeder Auth-Flow-Test schon.
 *
 * Lokal:  npm run e2e
 * UI:     npm run e2e:ui
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4173/PO-Suite/',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/PO-Suite/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
