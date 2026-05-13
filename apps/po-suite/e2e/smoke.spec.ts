import { test, expect } from '@playwright/test';

test.describe('PO Suite — Smoke', () => {
  test('Login-Page laedt ohne Fehler', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // App routet von / via Navigate-Replace nach /auth (kein User → Auth-Page)
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'AI Tools' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();

    // Keine Console- oder unhandled JS-Errors
    expect(consoleErrors).toEqual([]);
  });

  test('Login-Form hat alle Felder mit korrekten Labels', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
    await expect(page.getByLabel(/Passwort/i, { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible();
  });

  test('Skip-Link erscheint bei Tab und zielt auf #main-content', async ({ page }) => {
    await page.goto('/auth');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Zum Inhalt springen/i });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
