import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const loginMock = vi.fn();
const setApiKeyMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    apiKey: null,
    setApiKey: setApiKeyMock,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

import { LoginForm } from './LoginForm';

beforeEach(() => {
  loginMock.mockReset();
  setApiKeyMock.mockReset();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LoginForm — Rendering', () => {
  it('zeigt E-Mail-, Passwort- und API-Key-Felder', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByLabelText(/Anthropic API-Key/i)).toBeInTheDocument();
  });

  it('zeigt Anmelden-Button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument();
  });

  it('Passwort-Feld ist vom Typ password', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Passwort')).toHaveAttribute('type', 'password');
  });

  it('API-Key-Feld ist vom Typ password', () => {
    render(<LoginForm />);
    const apiKeyInput = screen.getByLabelText(/Anthropic API-Key/i);
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});

// ─── Passwort-Sichtbarkeit ────────────────────────────────────────────────────

describe('LoginForm — Passwort-Anzeige', () => {
  it('schaltet Passwort-Sichtbarkeit per Reveal-Button um', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const pwInput = screen.getByLabelText('Passwort');
    expect(pwInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /Passwort anzeigen/i }));
    expect(pwInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /Passwort verbergen/i }));
    expect(pwInput).toHaveAttribute('type', 'password');
  });

  it('schaltet API-Key-Sichtbarkeit per Reveal-Button um', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const apiKeyInput = screen.getByLabelText(/Anthropic API-Key/i);
    expect(apiKeyInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /API-Key anzeigen/i }));
    expect(apiKeyInput).toHaveAttribute('type', 'text');
  });
});

// ─── Submit ───────────────────────────────────────────────────────────────────

describe('LoginForm — Submit', () => {
  it('ruft login mit email und password auf', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'test@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'geheim');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock.mock.calls[0][0]).toBe('test@example.com');
    expect(loginMock.mock.calls[0][1]).toBe('geheim');
  });

  it('übergibt API-Key wenn ausgefüllt', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'test@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'geheim');
    await user.type(screen.getByLabelText(/Anthropic API-Key/i), 'sk-ant-test');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock.mock.calls[0][2]).toBe('sk-ant-test');
  });

  it('übergibt undefined als API-Key wenn leer', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'test@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'geheim');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    expect(loginMock.mock.calls[0][2]).toBeUndefined();
  });
});

// ─── Fehler ───────────────────────────────────────────────────────────────────

describe('LoginForm — Fehlerbehandlung', () => {
  it('zeigt Fehlermeldung bei Login-Fehler', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(new Error('Ungültige E-Mail-Adresse oder Passwort'));
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'falsch@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'falsch');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/Ungültige E-Mail-Adresse oder Passwort/);
  });

  it('zeigt Konfigurationsfehler wenn Env-Vars fehlen', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(
      new Error('Auth ist nicht konfiguriert. Lege eine .env-Datei an'),
    );
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'test@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'test');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/Auth ist nicht konfiguriert/);
  });

  it('löscht vorherige Fehlermeldung beim erneuten Submit', async () => {
    const user = userEvent.setup();
    loginMock
      .mockRejectedValueOnce(new Error('Fehler'))
      .mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-Mail/i), 'test@example.com');
    await user.type(screen.getByLabelText('Passwort'), 'test');
    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Anmelden/i }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
