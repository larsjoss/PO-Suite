import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextPolisherInputPanel } from './TextPolisherInputPanel';
import type { UseCase, Tone } from '../../hooks/useTextPolisher';

interface SetupOptions {
  useCase?: UseCase;
  tone?: Tone;
  input?: string;
  isLoading?: boolean;
  error?: Error | null;
}

function setup(opts: SetupOptions = {}) {
  const {
    useCase = 'email',
    tone = 'formell',
    input = '',
    isLoading = false,
    error = null,
  } = opts;

  const handlers = {
    onUseCaseChange: vi.fn(),
    onToneChange: vi.fn(),
    onInputChange: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onClear: vi.fn(),
  };

  render(
    <TextPolisherInputPanel
      useCase={useCase}
      tone={tone}
      input={input}
      isLoading={isLoading}
      error={error}
      {...handlers}
    />,
  );

  return handlers;
}

describe('TextPolisherInputPanel', () => {
  describe('Submit-Button', () => {
    it('zeigt "E-Mail schreiben" für use case email', () => {
      setup({ useCase: 'email' });
      expect(screen.getByRole('button', { name: 'E-Mail schreiben' })).toBeInTheDocument();
    });

    it('zeigt "Meetingnotiz erstellen" für use case meeting', () => {
      setup({ useCase: 'meeting' });
      expect(screen.getByRole('button', { name: 'Meetingnotiz erstellen' })).toBeInTheDocument();
    });

    it('zeigt "Text aufbereiten" für use case freetext', () => {
      setup({ useCase: 'freetext' });
      expect(screen.getByRole('button', { name: 'Text aufbereiten' })).toBeInTheDocument();
    });

    it('ist deaktiviert wenn Input leer', () => {
      setup({ input: '' });
      expect(screen.getByRole('button', { name: 'E-Mail schreiben' })).toBeDisabled();
    });

    it('ist deaktiviert wenn Input nur Whitespace', () => {
      setup({ input: '   ' });
      expect(screen.getByRole('button', { name: 'E-Mail schreiben' })).toBeDisabled();
    });

    it('ist aktiv wenn Input vorhanden', () => {
      setup({ input: 'Hallo' });
      expect(screen.getByRole('button', { name: 'E-Mail schreiben' })).toBeEnabled();
    });

    it('zeigt Loading-Label während isLoading', () => {
      setup({ useCase: 'email', isLoading: true, input: 'Text' });
      expect(screen.getByRole('button', { name: 'Wird geschrieben…' })).toBeInTheDocument();
    });
  });

  describe('Clear-Button', () => {
    it('ist nicht sichtbar wenn Input leer', () => {
      setup({ input: '' });
      expect(screen.queryByRole('button', { name: 'Eingabe löschen' })).not.toBeInTheDocument();
    });

    it('ist sichtbar wenn Input vorhanden', () => {
      setup({ input: 'Etwas' });
      expect(screen.getByRole('button', { name: 'Eingabe löschen' })).toBeInTheDocument();
    });

    it('ist nicht sichtbar während isLoading', () => {
      setup({ input: 'Etwas', isLoading: true });
      expect(screen.queryByRole('button', { name: 'Eingabe löschen' })).not.toBeInTheDocument();
    });

    it('ruft onClear auf beim Klick', async () => {
      const { onClear } = setup({ input: 'Etwas' });
      await userEvent.click(screen.getByRole('button', { name: 'Eingabe löschen' }));
      expect(onClear).toHaveBeenCalledOnce();
    });
  });

  describe('Ton-Auswahl', () => {
    it('ist nur bei email sichtbar', () => {
      setup({ useCase: 'email' });
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('ist bei meeting nicht sichtbar', () => {
      setup({ useCase: 'meeting' });
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });

    it('ist bei freetext nicht sichtbar', () => {
      setup({ useCase: 'freetext' });
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });

  describe('Fehleranzeige', () => {
    it('zeigt Fehlermeldung bei Error-Objekt', () => {
      setup({ error: new Error('Etwas ist schiefgelaufen') });
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
    });

    it('zeigt keine Fehlermeldung wenn error null', () => {
      setup({ error: null });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Formular-Submit', () => {
    it('ruft onSubmit auf beim Klick auf Submit-Button', async () => {
      const { onSubmit } = setup({ input: 'Testinhalt' });
      await userEvent.click(screen.getByRole('button', { name: 'E-Mail schreiben' }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });
});
