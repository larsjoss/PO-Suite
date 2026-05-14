import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const generateTestCasesMock = vi.fn();

vi.mock('../services/testCaseGenerator', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('../services/testCaseGenerator')>(
    '../services/testCaseGenerator',
  );
  return {
    ...actual,
    generateTestCases: (...args: unknown[]) => generateTestCasesMock(...args),
  };
});

import { TestCaseGeneratorPage } from './TestCaseGeneratorPage';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const MOCK_PLAN = {
  story_title: 'Login-Feature',
  story_id: null,
  generated_at: '2025-01-01T10:00:00.000Z',
  summary: {
    total_count: 1,
    by_level: { ENTW: 1 },
    by_type: { happy_path: 1 },
    ak_coverage: [{ ak_id: 'AK-1', covered: true, tc_count: 1 }],
    gaps: [],
    risk_flags: [],
  },
  test_cases: [
    {
      id: 'TC-001',
      title: 'Erfolgreicher Login',
      type: 'happy_path' as const,
      level: 'ENTW' as const,
      linked_aks: ['AK-1'],
      preconditions: ['User existiert'],
      steps: [{ step: 1, action: 'URL aufrufen' }],
      expected_result: 'User ist eingeloggt',
      flag: null,
    },
  ],
};

beforeEach(() => {
  generateTestCasesMock.mockReset();
});

// ─── Initial Render ───────────────────────────────────────────────────────────

describe('TestCaseGeneratorPage — Initial Render', () => {
  it('zeigt Input-Screen', () => {
    render(<TestCaseGeneratorPage />, { wrapper });
    expect(
      screen.getByRole('button', { name: /Testplan generieren/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /Generierter Testplan/i }),
    ).not.toBeInTheDocument();
  });

  it('Submit-Button ist disabled bei leerem Story-Text', () => {
    render(<TestCaseGeneratorPage />, { wrapper });
    expect(screen.getByRole('button', { name: /Testplan generieren/i })).toBeDisabled();
  });
});

// ─── Happy Path ───────────────────────────────────────────────────────────────

describe('TestCaseGeneratorPage — Submit Happy Path', () => {
  it('zeigt Output-Screen nach erfolgreichem Submit', async () => {
    const user = userEvent.setup();
    generateTestCasesMock.mockResolvedValueOnce(MOCK_PLAN);
    render(<TestCaseGeneratorPage />, { wrapper });

    await user.type(
      screen.getByLabelText(/User Story/i),
      'Als User möchte ich mich einloggen',
    );
    await user.click(screen.getByRole('button', { name: /Testplan generieren/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /Generierter Testplan/i }),
      ).toBeInTheDocument();
    });
  });
});

// ─── Error ────────────────────────────────────────────────────────────────────

describe('TestCaseGeneratorPage — Submit Error', () => {
  it('bleibt auf Input-Screen bei Service-Fehler', async () => {
    const user = userEvent.setup();
    generateTestCasesMock.mockRejectedValueOnce(new Error('API timeout'));
    render(<TestCaseGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/User Story/i), 'Story Text');
    await user.click(screen.getByRole('button', { name: /Testplan generieren/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/API timeout/);
    // Bleibt auf Input-Screen
    expect(screen.getByRole('button', { name: /Testplan generieren/i })).toBeInTheDocument();
  });
});

// ─── Reset ────────────────────────────────────────────────────────────────────

describe('TestCaseGeneratorPage — Reset', () => {
  it('kehrt zum Input-Screen zurück', async () => {
    const user = userEvent.setup();
    generateTestCasesMock.mockResolvedValueOnce(MOCK_PLAN);
    render(<TestCaseGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/User Story/i), 'Story');
    await user.click(screen.getByRole('button', { name: /Testplan generieren/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /Generierter Testplan/i })).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: /Zurück zur Eingabe/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Testplan generieren/i })).toBeInTheDocument(),
    );
  });
});
