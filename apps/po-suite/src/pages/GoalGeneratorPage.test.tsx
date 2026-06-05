import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const generateGoalsMock = vi.fn();
const refineGoalMock = vi.fn();

vi.mock('../services/goalGenerator', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('../services/goalGenerator')>(
    '../services/goalGenerator',
  );
  return {
    ...actual,
    generateGoals: (...args: unknown[]) => generateGoalsMock(...args),
    refineGoal: (...args: unknown[]) => refineGoalMock(...args),
  };
});

import { GoalGeneratorPage } from './GoalGeneratorPage';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
}

const MOCK_VARIANTS = [
  { text: 'Variante 1: Bessere Search-UX', quality: 'Klares Outcome', weakness: null },
  { text: 'Variante 2: Schnellere Suche', quality: 'Messbar', weakness: 'Etwas generisch' },
];

const MOCK_RESULT = {
  variants: MOCK_VARIANTS,
  rawText: 'Variante 1: Bessere Search-UX\nQualität: Klares Outcome\n\nVariante 2: Schnellere Suche\nQualität: Messbar',
};

const confirmSpy = vi.spyOn(window, 'confirm');

beforeEach(() => {
  generateGoalsMock.mockReset();
  refineGoalMock.mockReset();
  confirmSpy.mockReset();
});

// ─── Initial Render ───────────────────────────────────────────────────────────

describe('GoalGeneratorPage — Initial Render', () => {
  it('zeigt Sprint Goal Tab als aktiv und Input-Formular', () => {
    render(<GoalGeneratorPage />, { wrapper });
    expect(screen.getByRole('heading', { name: /Goal Generator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Varianten generieren/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /Generierte Varianten/i }),
    ).not.toBeInTheDocument();
  });

  it('Submit-Button disabled wenn Ideen-Feld leer', () => {
    render(<GoalGeneratorPage />, { wrapper });
    expect(screen.getByRole('button', { name: /Varianten generieren/i })).toBeDisabled();
  });
});

// ─── Tab-Wechsel ──────────────────────────────────────────────────────────────

describe('GoalGeneratorPage — Tab-Wechsel', () => {
  it('wechselt auf PI Objective ohne confirm wenn kein Inhalt', async () => {
    const user = userEvent.setup();
    render(<GoalGeneratorPage />, { wrapper });

    await user.click(screen.getByRole('tab', { name: /PI Objective/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/ART-Feature Titel/i)).toBeInTheDocument();
  });

  it('fragt confirm wenn Inhalt vorhanden und respektiert Abbruch', async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValueOnce(false);
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Bessere Search-UX');
    await user.click(screen.getByRole('tab', { name: /PI Objective/i }));

    expect(confirmSpy).toHaveBeenCalled();
    // Bleibt auf Sprint Goal
    expect(screen.getByLabelText(/Sprint Goal Idee/i)).toBeInTheDocument();
  });

  it('wechselt Tab und löscht Eingaben bei confirm=true', async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValueOnce(true);
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Meine Idee');
    await user.click(screen.getByRole('tab', { name: /PI Objective/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/ART-Feature Titel/i)).toBeInTheDocument();
    });
  });
});

// ─── Submit Happy Path ────────────────────────────────────────────────────────

describe('GoalGeneratorPage — Submit Happy Path', () => {
  it('zeigt Output-Screen nach erfolgreichem Submit', async () => {
    const user = userEvent.setup();
    generateGoalsMock.mockResolvedValueOnce(MOCK_RESULT);
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Bessere Search-UX');
    await user.click(screen.getByRole('button', { name: /Varianten generieren/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /Generierte Varianten/i }),
      ).toBeInTheDocument();
    });
    expect(generateGoalsMock).toHaveBeenCalledTimes(1);
  });
});

// ─── Error ────────────────────────────────────────────────────────────────────

describe('GoalGeneratorPage — Submit Error', () => {
  it('bleibt auf Input-Screen bei Service-Fehler', async () => {
    const user = userEvent.setup();
    generateGoalsMock.mockRejectedValueOnce(new Error('Netzwerkfehler'));
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Idee');
    await user.click(screen.getByRole('button', { name: /Varianten generieren/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/Netzwerkfehler/);
    expect(screen.getByRole('button', { name: /Varianten generieren/i })).toBeInTheDocument();
  });
});

// ─── Reset ───────────────────────────────────────────────────────────────────

describe('GoalGeneratorPage — Reset', () => {
  it('kehrt zum Input-Screen zurück bei confirm=true', async () => {
    const user = userEvent.setup();
    generateGoalsMock.mockResolvedValueOnce(MOCK_RESULT);
    confirmSpy.mockReturnValueOnce(true);
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Idee');
    await user.click(screen.getByRole('button', { name: /Varianten generieren/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /Generierte Varianten/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Varianten generieren/i })).toBeInTheDocument(),
    );
  });

  it('bleibt auf Output-Screen bei confirm=false', async () => {
    const user = userEvent.setup();
    generateGoalsMock.mockResolvedValueOnce(MOCK_RESULT);
    confirmSpy.mockReturnValueOnce(false);
    render(<GoalGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Sprint Goal Idee/i), 'Idee');
    await user.click(screen.getByRole('button', { name: /Varianten generieren/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /Generierte Varianten/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));

    expect(
      screen.getByRole('region', { name: /Generierte Varianten/i }),
    ).toBeInTheDocument();
  });
});
