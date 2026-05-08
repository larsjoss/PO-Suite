import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestCaseCard } from './TestCaseCard';
import type { TestCase } from '../../types';

const baseCase: TestCase = {
  id: 'TC-01',
  title: 'Login mit gültigen Credentials',
  type: 'happy_path',
  level: 'INTG',
  preconditions: ['Nutzer ist ausgeloggt', 'Gültige Credentials vorhanden'],
  steps: [
    { step: 1, action: 'Öffne die Login-Seite' },
    { step: 2, action: 'Gib E-Mail und Passwort ein' },
    { step: 3, action: 'Klicke Anmelden' },
  ],
  expected_result: 'Nutzer ist eingeloggt und sieht das Dashboard.',
  linked_aks: ['AK-1', 'AK-2'],
  source: 'story_ak',
};

function renderCard(tc: TestCase = baseCase) {
  const { container } = render(
    <ul>
      <TestCaseCard testCase={tc} />
    </ul>,
  );
  // ul > li direkt selektieren, da TestCaseCard selbst verschachtelte li-Elemente enthält
  return container.querySelector('ul > li') as HTMLElement;
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('TestCaseCard', () => {
  describe('Stammdaten', () => {
    it('rendert TC-ID und Titel', () => {
      renderCard();
      expect(screen.getByText('TC-01')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Login mit gültigen Credentials' }),
      ).toBeInTheDocument();
    });

    it('rendert Typ-Badge', () => {
      renderCard();
      expect(screen.getByText('Happy Path')).toBeInTheDocument();
    });

    it('rendert Level-Badge', () => {
      renderCard();
      expect(screen.getByText('INTG')).toBeInTheDocument();
    });

    it('rendert verknüpfte AKs', () => {
      renderCard();
      expect(screen.getByText(/AK-1.*AK-2/)).toBeInTheDocument();
    });

    it('rendert alle Voraussetzungen', () => {
      renderCard();
      expect(screen.getByText('Nutzer ist ausgeloggt')).toBeInTheDocument();
      expect(screen.getByText('Gültige Credentials vorhanden')).toBeInTheDocument();
    });

    it('rendert alle Schritte mit Nummerierung', () => {
      renderCard();
      expect(screen.getByText('Öffne die Login-Seite')).toBeInTheDocument();
      expect(screen.getByText('Gib E-Mail und Passwort ein')).toBeInTheDocument();
      expect(screen.getByText('Klicke Anmelden')).toBeInTheDocument();
    });

    it('rendert das erwartete Ergebnis', () => {
      renderCard();
      expect(
        screen.getByText('Nutzer ist eingeloggt und sieht das Dashboard.'),
      ).toBeInTheDocument();
    });

    it('rendert die Quellen-Bezeichnung', () => {
      const li = renderCard();
      expect(li.textContent).toContain('Story-AK');
    });
  });

  describe('Flag-Callout', () => {
    it('zeigt keinen Callout wenn kein Flag vorhanden', () => {
      const li = renderCard();
      expect(li.textContent).not.toMatch(/offene frage|abhängigkeit|risiko|annahme/i);
    });

    it('zeigt Callout für open_question mit Meldung', () => {
      const tc: TestCase = {
        ...baseCase,
        flag: { type: 'open_question', message: 'Welche Sprache wird verwendet?' },
      };
      const li = renderCard(tc);
      expect(li.textContent).toContain('Offene Frage');
      expect(li.textContent).toContain('Welche Sprache wird verwendet?');
    });

    it('zeigt Callout für risk mit Meldung', () => {
      const tc: TestCase = {
        ...baseCase,
        flag: { type: 'risk', message: 'Kritischer Migrationspfad.' },
      };
      const li = renderCard(tc);
      expect(li.textContent).toContain('Risiko');
      expect(li.textContent).toContain('Kritischer Migrationspfad.');
    });

    it('zeigt Callout für dependency', () => {
      const tc: TestCase = {
        ...baseCase,
        flag: { type: 'dependency', message: 'Benötigt Staging-Umgebung.' },
      };
      const li = renderCard(tc);
      expect(li.textContent).toContain('Abhängigkeit');
    });
  });

  describe('Flag-Styling', () => {
    it('Card hat bg-amber-50 wenn Flag vorhanden', () => {
      const tc: TestCase = {
        ...baseCase,
        flag: { type: 'open_question', message: 'Klärung nötig.' },
      };
      const li = renderCard(tc);
      expect(li.className).toContain('bg-amber-50');
    });

    it('Card hat bg-surface wenn kein Flag vorhanden', () => {
      const li = renderCard(baseCase);
      expect(li.className).toContain('bg-surface');
    });
  });

  describe('Copy-Funktionalität', () => {
    it('rendert Kopieren-Button', () => {
      renderCard();
      expect(screen.getByRole('button', { name: /kopieren/i })).toBeInTheDocument();
    });

    it('zeigt "Kopiert" nach dem Klick', async () => {
      renderCard();
      await userEvent.click(screen.getByRole('button', { name: /kopieren/i }));
      expect(await screen.findByText('Kopiert')).toBeInTheDocument();
    });

    it('ruft clipboard.writeText mit dem TC-Markdown auf', async () => {
      renderCard();
      await userEvent.click(screen.getByRole('button', { name: /kopieren/i }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
      const calledWith = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
      expect(calledWith).toContain('TC-01');
      expect(calledWith).toContain('Login mit gültigen Credentials');
    });
  });

  describe('Quellen-Label', () => {
    it('zeigt "Screenshot" für source=screenshot', () => {
      const li = renderCard({ ...baseCase, source: 'screenshot' });
      expect(li.textContent).toContain('Screenshot');
    });

    it('zeigt "Testkontext" für source=test_context', () => {
      const li = renderCard({ ...baseCase, source: 'test_context' });
      expect(li.textContent).toContain('Testkontext');
    });

    it('zeigt "Modell-Ergänzung" für source=model_addition', () => {
      const li = renderCard({ ...baseCase, source: 'model_addition' });
      expect(li.textContent).toContain('Modell-Ergänzung');
    });
  });
});
