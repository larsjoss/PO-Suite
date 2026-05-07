import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const setApiKeyMock = vi.fn();
let mockApiKey: string | null = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'x@y.ch' },
    apiKey: mockApiKey,
    setApiKey: setApiKeyMock,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { SettingsDialog } from './SettingsDialog';

beforeEach(() => {
  setApiKeyMock.mockReset();
  mockApiKey = null;

  // jsdom <29 hat showModal() per default; wir stellen sicher dass
  // close()/showModal() ueberhaupt vorhanden sind.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
  }
});

describe('SettingsDialog — open/close', () => {
  it('rendert Dialog mit aria-labelledby', () => {
    render(<SettingsDialog open={true} onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: /API-Key ändern/i })).toBeInTheDocument();
  });

  it('rendert geschlossen ohne open-Prop sichtbar', () => {
    const { container } = render(<SettingsDialog open={false} onClose={() => {}} />);
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');
  });
});

describe('SettingsDialog — Speichern', () => {
  it('Speichern-Button ist disabled bei leerem Input', () => {
    mockApiKey = null;
    render(<SettingsDialog open={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('Speichern-Button ist aktiv mit Eingabe', async () => {
    const user = userEvent.setup();
    mockApiKey = null;
    render(<SettingsDialog open={true} onClose={() => {}} />);
    await user.type(screen.getByLabelText(/Anthropic API-Key/i), 'sk-ant-xy');
    expect(screen.getByRole('button', { name: 'Speichern' })).not.toBeDisabled();
  });

  it('Klick auf Speichern ruft setApiKey + onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsDialog open={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/Anthropic API-Key/i), 'sk-ant-xy');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(setApiKeyMock).toHaveBeenCalledWith('sk-ant-xy');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('trimmt Whitespace beim Speichern', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onClose={() => {}} />);
    await user.type(screen.getByLabelText(/Anthropic API-Key/i), '  sk-ant  ');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(setApiKeyMock).toHaveBeenCalledWith('sk-ant');
  });
});

describe('SettingsDialog — Abbrechen', () => {
  it('Abbrechen ruft onClose, ohne setApiKey', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsDialog open={true} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(setApiKeyMock).not.toHaveBeenCalled();
  });
});

describe('SettingsDialog — Pre-Fill', () => {
  it('lädt vorhandenen apiKey beim Öffnen ins Input', () => {
    mockApiKey = 'sk-ant-existing';
    render(<SettingsDialog open={true} onClose={() => {}} />);
    expect(screen.getByLabelText(/Anthropic API-Key/i)).toHaveValue('sk-ant-existing');
  });
});
