import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const generateDocMock = vi.fn();

vi.mock('../services/docGenerator', () => ({
  generateDoc: (...args: unknown[]) => generateDocMock(...args),
}));

import { DocGeneratorPage } from './DocGeneratorPage';

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

beforeEach(() => {
  generateDocMock.mockReset();
});

// ─── Initial Render ──────────────────────────────────────────────────────────

describe('DocGeneratorPage — Initial Render', () => {
  it('zeigt Input-Screen mit Story-Modus aktiv', () => {
    render(<DocGeneratorPage />, { wrapper });
    expect(screen.getByLabelText(/Story-Titel/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Generierte Dokumentation/i })).not.toBeInTheDocument();
  });
});

// ─── Submit Happy Path ───────────────────────────────────────────────────────

describe('DocGeneratorPage — Submit Happy Path', () => {
  it('zeigt Output-Screen nach erfolgreichem Submit', async () => {
    const user = userEvent.setup();
    generateDocMock.mockResolvedValueOnce('# Mein generierter Output');
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'Mein Titel');
    await user.type(
      screen.getByLabelText(/Story-Beschreibung/i),
      'Beschreibung des Tickets',
    );
    await user.click(screen.getByRole('button', { name: /Dokumentation generieren/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /Generierte Dokumentation/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Mein generierter Output')).toBeInTheDocument();
    expect(generateDocMock).toHaveBeenCalled();
  });
});

// ─── Submit Error ─────────────────────────────────────────────────────────────

describe('DocGeneratorPage — Submit Error', () => {
  it('bleibt auf Input-Screen bei Service-Fehler', async () => {
    const user = userEvent.setup();
    generateDocMock.mockRejectedValueOnce(new Error('API timeout'));
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'T');
    await user.type(screen.getByLabelText(/Story-Beschreibung/i), 'B');
    await user.click(screen.getByRole('button', { name: /Dokumentation generieren/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/API timeout/);
    // Immer noch auf Input-Screen
    expect(screen.getByLabelText(/Story-Titel/i)).toBeInTheDocument();
  });
});

// ─── Reset ────────────────────────────────────────────────────────────────────

describe('DocGeneratorPage — Reset', () => {
  it('zurück zu Input mit leeren Feldern nach Bestätigung im Dialog', async () => {
    const user = userEvent.setup();
    generateDocMock.mockResolvedValueOnce('# Doku');
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'Titel');
    await user.type(screen.getByLabelText(/Story-Beschreibung/i), 'Desc');
    await user.click(screen.getByRole('button', { name: /Dokumentation generieren/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /Generierte Dokumentation/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /Bestätigen/i }));

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Story-Titel/i) as HTMLInputElement;
      expect(titleInput.value).toBe('');
    });
  });

  it('bleibt auf Output bei Abbrechen im Dialog', async () => {
    const user = userEvent.setup();
    generateDocMock.mockResolvedValueOnce('# Doku');
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'Titel');
    await user.type(screen.getByLabelText(/Story-Beschreibung/i), 'Desc');
    await user.click(screen.getByRole('button', { name: /Dokumentation generieren/i }));

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /Generierte Dokumentation/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /Abbrechen/i }));

    expect(
      screen.getByRole('region', { name: /Generierte Dokumentation/i }),
    ).toBeInTheDocument();
  });
});

// ─── Mode-Wechsel ────────────────────────────────────────────────────────────

describe('DocGeneratorPage — Mode-Wechsel', () => {
  it('wechselt ohne Dialog wenn keine Eingabe', async () => {
    const user = userEvent.setup();
    render(<DocGeneratorPage />, { wrapper });

    await user.click(screen.getByRole('tab', { name: /Feature/i }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Enthaltene Stories/i)).toBeInTheDocument();
  });

  it('zeigt Dialog bei Eingaben und respektiert Abbrechen', async () => {
    const user = userEvent.setup();
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'Mein Titel');
    await user.click(screen.getByRole('tab', { name: /Feature/i }));

    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /Abbrechen/i }));

    expect((screen.getByLabelText(/Story-Titel/i) as HTMLInputElement).value).toBe('Mein Titel');
  });

  it('wechselt nach Bestätigung und löscht Eingaben', async () => {
    const user = userEvent.setup();
    render(<DocGeneratorPage />, { wrapper });

    await user.type(screen.getByLabelText(/Story-Titel/i), 'Mein Titel');
    await user.click(screen.getByRole('tab', { name: /Feature/i }));

    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /Bestätigen/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Enthaltene Stories/i)).toBeInTheDocument();
    });
    const featureTitle = screen.getByLabelText(/Feature-Titel/i) as HTMLInputElement;
    expect(featureTitle.value).toBe('');
  });
});
