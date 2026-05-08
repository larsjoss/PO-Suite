import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocGeneratorInputPanel } from './DocGeneratorInputPanel';
import type { DocMode, StoryDocInput, FeatureDocInput } from '../../types';

const EMPTY_STORY: StoryDocInput = {
  title: '',
  description: '',
  confluenceSpec: '',
  code: '',
  acceptedBy: '',
  deploymentDate: '',
};

const EMPTY_FEATURE: FeatureDocInput = {
  title: '',
  description: '',
  stories: '',
  confluenceSpec: '',
  code: '',
  responsible: '',
  deploymentDate: '',
};

interface SetupProps {
  mode?: DocMode;
  storyInput?: StoryDocInput;
  featureInput?: FeatureDocInput;
  screenshots?: never[];
  isLoading?: boolean;
  error?: Error | null;
}

const defaultProps = {
  mode: 'story' as DocMode,
  storyInput: EMPTY_STORY,
  featureInput: EMPTY_FEATURE,
  screenshots: [] as never[],
  isLoading: false,
  error: null as Error | null,
  onModeChange: vi.fn(),
  onStoryChange: vi.fn(),
  onFeatureChange: vi.fn(),
  onScreenshotsChange: vi.fn(),
  onSubmit: vi.fn(),
};

function setup(overrides: SetupProps = {}) {
  const handlers = {
    onModeChange: vi.fn(),
    onStoryChange: vi.fn(),
    onFeatureChange: vi.fn(),
    onScreenshotsChange: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
  };
  render(<DocGeneratorInputPanel {...defaultProps} {...overrides} {...handlers} />);
  return handlers;
}

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
});

describe('DocGeneratorInputPanel', () => {
  describe('Story Mode — Pflichtfelder', () => {
    it('Submit-Button ist disabled wenn Titel und Beschreibung leer', () => {
      setup({ mode: 'story', storyInput: EMPTY_STORY });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });

    it('Submit-Button ist disabled wenn nur Titel ausgefüllt', () => {
      setup({ mode: 'story', storyInput: { ...EMPTY_STORY, title: 'Login' } });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });

    it('Submit-Button ist disabled wenn nur Beschreibung ausgefüllt', () => {
      setup({ mode: 'story', storyInput: { ...EMPTY_STORY, description: 'Als Nutzer…' } });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });

    it('Submit-Button ist enabled wenn Titel und Beschreibung ausgefüllt', () => {
      setup({
        mode: 'story',
        storyInput: { ...EMPTY_STORY, title: 'Login', description: 'Als Nutzer…' },
      });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeEnabled();
    });

    it('Submit-Button bleibt disabled bei Leerzeichen-only', () => {
      setup({
        mode: 'story',
        storyInput: { ...EMPTY_STORY, title: '   ', description: '   ' },
      });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });
  });

  describe('Feature Mode — Pflichtfelder', () => {
    it('Submit-Button ist disabled wenn Titel, Beschreibung und Stories leer', () => {
      setup({ mode: 'feature', featureInput: EMPTY_FEATURE });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });

    it('Submit-Button ist disabled wenn Stories fehlt', () => {
      setup({
        mode: 'feature',
        featureInput: { ...EMPTY_FEATURE, title: 'Benutzerverwaltung', description: 'Feature für…' },
      });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeDisabled();
    });

    it('Submit-Button ist enabled wenn alle drei Pflichtfelder ausgefüllt', () => {
      setup({
        mode: 'feature',
        featureInput: {
          ...EMPTY_FEATURE,
          title: 'Benutzerverwaltung',
          description: 'Feature für…',
          stories: 'Story 1: …',
        },
      });
      expect(screen.getByRole('button', { name: 'Dokumentation generieren' })).toBeEnabled();
    });
  });

  describe('Modusspezifische Felder', () => {
    it('zeigt Story-Titel-Label in Story Mode', () => {
      setup({ mode: 'story' });
      expect(screen.getByLabelText('Story-Titel')).toBeInTheDocument();
    });

    it('zeigt Feature-Titel-Label in Feature Mode', () => {
      setup({ mode: 'feature' });
      expect(screen.getByLabelText('Feature-Titel')).toBeInTheDocument();
    });

    it('zeigt Enthaltene-Stories-Feld nur in Feature Mode', () => {
      setup({ mode: 'story' });
      expect(screen.queryByLabelText('Enthaltene Stories')).toBeNull();

      setup({ mode: 'feature' });
      expect(screen.getAllByLabelText('Enthaltene Stories')[0]).toBeInTheDocument();
    });

    it('zeigt Abnahme-durch-Feld in Story Mode', () => {
      setup({ mode: 'story' });
      expect(screen.getByLabelText(/Abnahme durch/)).toBeInTheDocument();
    });

    it('zeigt Verantwortlich-Feld in Feature Mode', () => {
      setup({ mode: 'feature' });
      expect(screen.getByLabelText(/Verantwortlich/)).toBeInTheDocument();
    });
  });

  describe('Ladezustand', () => {
    it('zeigt Ladezustand im Submit-Button', () => {
      setup({ isLoading: true });
      expect(
        screen.getByRole('button', { name: 'Dokumentation wird generiert…' }),
      ).toBeInTheDocument();
    });

    it('Submit-Button ist disabled während Ladezustand', () => {
      setup({
        isLoading: true,
        storyInput: { ...EMPTY_STORY, title: 'Login', description: 'Als Nutzer…' },
      });
      expect(screen.getByRole('button', { name: 'Dokumentation wird generiert…' })).toBeDisabled();
    });
  });

  describe('Fehleranzeige', () => {
    it('zeigt Fehlermeldung wenn error gesetzt', () => {
      setup({ error: new Error('API-Fehler: Timeout') });
      expect(screen.getByText('API-Fehler: Timeout')).toBeInTheDocument();
    });

    it('zeigt keine Fehlermeldung wenn error null', () => {
      setup({ error: null });
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('Modell-Selektor', () => {
    it('ruft onModeChange auf Klick auf Feature Mode auf', async () => {
      const { onModeChange } = setup({ mode: 'story' });
      await userEvent.click(screen.getByRole('tab', { name: 'Feature Mode' }));
      expect(onModeChange).toHaveBeenCalledWith('feature');
    });
  });
});
