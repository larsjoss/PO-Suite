import { test, expect } from '@playwright/test';

const EMAIL = process.env.VITE_AUTH_EMAIL ?? 'test@example.com';
const PASSWORD = process.env.VITE_AUTH_PASSWORD ?? 'testpass123';

test.describe('PO Suite — Auth-Flow', () => {
  test('Erfolgreicher Login leitet auf /tools weiter', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();

    await page.getByLabel(/E-Mail/i).fill(EMAIL);
    await page.getByLabel(/Passwort/i, { exact: false }).fill(PASSWORD);
    await page.getByRole('button', { name: /Anmelden/i }).click();

    await expect(page).toHaveURL(/\/tools$/);
    await expect(page.getByRole('link', { name: 'AI Tools' })).toBeVisible();
  });

  test('Login mit falschem Passwort zeigt Fehlermeldung', async ({ page }) => {
    await page.goto('/auth');

    await page.getByLabel(/E-Mail/i).fill(EMAIL);
    await page.getByLabel(/Passwort/i, { exact: false }).fill(PASSWORD + 'WRONG');
    await page.getByRole('button', { name: /Anmelden/i }).click();

    // InlineError hat role="alert" — WCAG aria-live="assertive"
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Ungültige|fehlgeschlagen|Passwort/i);

    // Bleibt auf /auth
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('Logout ueber TopNav leitet auf /auth weiter', async ({ page }) => {
    // Einloggen
    await page.goto('/auth');
    await page.getByLabel(/E-Mail/i).fill(EMAIL);
    await page.getByLabel(/Passwort/i, { exact: false }).fill(PASSWORD);
    await page.getByRole('button', { name: /Anmelden/i }).click();
    await expect(page).toHaveURL(/\/tools$/);

    // Abmelden via TopNav-Button (aria-label="Abmelden")
    await page.getByRole('button', { name: 'Abmelden' }).click();

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  });
});
