import { test, expect } from '@playwright/test';

const EMAIL = process.env.VITE_AUTH_EMAIL ?? 'test@example.com';
const PASSWORD = process.env.VITE_AUTH_PASSWORD ?? 'testpass123';

async function login(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto('/auth');
  await page.getByLabel(/E-Mail/i).fill(EMAIL);
  await page.getByLabel(/Passwort/i, { exact: false }).fill(PASSWORD);
  await page.getByRole('button', { name: /Anmelden/i }).click();
  await expect(page).toHaveURL(/\/tools$/);
}

test.describe('Doc Generator — ConfirmDialog', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/tools/doc-generator');
  });

  test('Modus-Wechsel ohne Eingaben öffnet keinen Dialog', async ({ page }) => {
    await page.getByRole('tab', { name: /Feature/i }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(page.getByLabel(/Enthaltene Stories/i)).toBeVisible();
  });

  test('Modus-Wechsel mit Eingaben öffnet ConfirmDialog', async ({ page }) => {
    await page.getByLabel(/Story-Titel/i).fill('Mein Titel');
    await page.getByRole('tab', { name: /Feature/i }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Modus wechseln');
    await expect(dialog).toContainText('Eingaben gehen verloren');
  });

  test('Abbrechen im ConfirmDialog behält Modus und Eingaben', async ({ page }) => {
    await page.getByLabel(/Story-Titel/i).fill('Mein Titel');
    await page.getByRole('tab', { name: /Feature/i }).click();

    await page.getByRole('button', { name: 'Abbrechen' }).click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(page.getByLabel(/Story-Titel/i)).toHaveValue('Mein Titel');
  });

  test('Bestätigen im ConfirmDialog wechselt Modus und leert Felder', async ({ page }) => {
    await page.getByLabel(/Story-Titel/i).fill('Mein Titel');
    await page.getByRole('tab', { name: /Feature/i }).click();

    await page.getByRole('button', { name: 'Bestätigen' }).click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(page.getByLabel(/Enthaltene Stories/i)).toBeVisible();
  });

  test('Escape schliesst ConfirmDialog ohne Modus-Wechsel', async ({ page }) => {
    await page.getByLabel(/Story-Titel/i).fill('Mein Titel');
    await page.getByRole('tab', { name: /Feature/i }).click();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    await expect(page.getByLabel(/Story-Titel/i)).toHaveValue('Mein Titel');
  });
});
