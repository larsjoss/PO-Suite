import { test, expect } from '@playwright/test';

const EMAIL = process.env.VITE_AUTH_EMAIL ?? 'test@example.com';
const PASSWORD = process.env.VITE_AUTH_PASSWORD ?? 'testpass123';

test.describe('PO Suite — Story Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/E-Mail/i).fill(EMAIL);
    await page.getByLabel(/Passwort/i, { exact: false }).fill(PASSWORD);
    await page.getByRole('button', { name: /Anmelden/i }).click();
    await expect(page).toHaveURL(/\/tools$/);

    await page.goto('/tools/story-generator');
  });

  test('Seite laedt mit Eingabefeld und Submit-Button', async ({ page }) => {
    // Textarea mit Label "Anforderung beschreiben" muss sichtbar sein
    await expect(page.getByLabel('Anforderung beschreiben')).toBeVisible();

    // Submit-Button muss sichtbar sein
    await expect(
      page.getByRole('button', { name: 'Story generieren' }),
    ).toBeVisible();
  });

  test('Submit-Button ist deaktiviert solange Eingabe leer ist', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Story generieren' });

    // Leeres Formular: Button ist disabled
    await expect(submitButton).toBeDisabled();
  });

  test('Submit-Button wird aktiv wenn Eingabe vorhanden ist', async ({ page }) => {
    const textarea = page.getByLabel('Anforderung beschreiben');
    const submitButton = page.getByRole('button', { name: 'Story generieren' });

    // Vor Eingabe: disabled
    await expect(submitButton).toBeDisabled();

    // Text eingeben
    await textarea.fill('Als Nutzer möchte ich mich anmelden können.');

    // Nach Eingabe: aktiv (kein API-Call wird ausgeloest)
    await expect(submitButton).toBeEnabled();
  });

  test('Submit-Button wird wieder deaktiviert wenn Eingabe geleert wird', async ({ page }) => {
    const textarea = page.getByLabel('Anforderung beschreiben');
    const submitButton = page.getByRole('button', { name: 'Story generieren' });

    await textarea.fill('Irgendeine Anforderung');
    await expect(submitButton).toBeEnabled();

    await textarea.fill('');
    await expect(submitButton).toBeDisabled();
  });
});
