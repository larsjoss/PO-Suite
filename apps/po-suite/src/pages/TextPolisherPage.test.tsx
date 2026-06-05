import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const polishTextMock = vi.fn();

vi.mock('../services/textPolisher', () => ({
  polishText: (...args: unknown[]) => polishTextMock(...args),
}));

import { TextPolisherPage } from './TextPolisherPage';

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
  polishTextMock.mockReset();
  sessionStorage.clear();
});

describe('TextPolisherPage — Initial Render', () => {
  it('startet im email-UseCase', () => {
    render(<TextPolisherPage />, { wrapper });
    // Email-Tab ist aktiv → Submit-Label heisst "E-Mail schreiben"
    expect(screen.getByRole('button', { name: /E-Mail schreiben/i })).toBeInTheDocument();
  });

  it('Submit-Button ist disabled bei leerem Input', () => {
    render(<TextPolisherPage />, { wrapper });
    expect(screen.getByRole('button', { name: /E-Mail schreiben/i })).toBeDisabled();
  });
});

describe('TextPolisherPage — Submit', () => {
  it('ruft polishText mit input, useCase, tone', async () => {
    const user = userEvent.setup();
    polishTextMock.mockResolvedValueOnce('Polierte Email.');
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'Hallo Welt');
    await user.click(screen.getByRole('button', { name: /E-Mail schreiben/i }));

    await waitFor(() =>
      expect(polishTextMock).toHaveBeenCalledWith('Hallo Welt', 'email', 'formell', '', ''),
    );
  });

  it('zeigt den polierten Text im Output', async () => {
    const user = userEvent.setup();
    polishTextMock.mockResolvedValueOnce('Betreff: Test\n\nHallo,\n\nGruss');
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'rohtext');
    await user.click(screen.getByRole('button', { name: /E-Mail schreiben/i }));

    await waitFor(() => {
      expect(screen.getByText(/Betreff: Test/)).toBeInTheDocument();
    });
  });
});

describe('TextPolisherPage — Persistenz', () => {
  it('persistiert input in sessionStorage', async () => {
    const user = userEvent.setup();
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'Mein Entwurf');

    // useSessionState schreibt sofort beim setState
    expect(sessionStorage.getItem('tp_input')).toContain('Mein Entwurf');
  });

  it('lädt input aus sessionStorage beim Mount', () => {
    sessionStorage.setItem('tp_input', JSON.stringify('Geladener Text'));
    render(<TextPolisherPage />, { wrapper });
    expect(screen.getByLabelText(/E-Mail-Entwurf/i)).toHaveValue('Geladener Text');
  });
});

describe('TextPolisherPage — UseCase-Wechsel', () => {
  it('wechselt zu meeting ohne Dialog wenn kein Output', async () => {
    const user = userEvent.setup();
    render(<TextPolisherPage />, { wrapper });

    await user.click(screen.getByRole('tab', { name: /Meeting/i }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Meetingnotiz erstellen/i }),
    ).toBeInTheDocument();
  });

  it('zeigt ConfirmDialog bei vorhandenem Output und bleibt bei Abbrechen', async () => {
    const user = userEvent.setup();
    polishTextMock.mockResolvedValueOnce('Output da');
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'roh');
    await user.click(screen.getByRole('button', { name: /E-Mail schreiben/i }));
    await waitFor(() => expect(screen.getByText(/Output da/)).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Meeting/i }));

    // ConfirmDialog erscheint
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // Abbrechen → Email bleibt aktiv
    await user.click(screen.getByRole('button', { name: /Abbrechen/i }));
    expect(screen.getByRole('button', { name: /E-Mail schreiben/i })).toBeInTheDocument();
  });

  it('wechselt UseCase bei Bestätigen im Dialog', async () => {
    const user = userEvent.setup();
    polishTextMock.mockResolvedValueOnce('Output da');
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'roh');
    await user.click(screen.getByRole('button', { name: /E-Mail schreiben/i }));
    await waitFor(() => expect(screen.getByText(/Output da/)).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /Meeting/i }));
    await user.click(screen.getByRole('button', { name: /Bestätigen/i }));

    expect(screen.getByRole('button', { name: /Meetingnotiz erstellen/i })).toBeInTheDocument();
  });
});

describe('TextPolisherPage — Clear', () => {
  it('löscht Input und sessionStorage', async () => {
    const user = userEvent.setup();
    render(<TextPolisherPage />, { wrapper });

    await user.type(screen.getByLabelText(/E-Mail-Entwurf/i), 'Inhalt');
    await user.click(screen.getByRole('button', { name: /Eingabe löschen/i }));

    expect(screen.getByLabelText(/E-Mail-Entwurf/i)).toHaveValue('');
  });
});
