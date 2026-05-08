import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextPolisherOutputPanel } from './TextPolisherOutputPanel';
import type { UseCase } from '../../hooks/useTextPolisher';

// Clipboard API mocken (jsdom hat keine echte Implementierung)
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

function setup(useCase: UseCase = 'email', output?: string, isLoading = false) {
  render(<TextPolisherOutputPanel useCase={useCase} output={output} isLoading={isLoading} />);
}

describe('TextPolisherOutputPanel', () => {
  describe('Panel-Titel', () => {
    it('zeigt "Geschriebene E-Mail" für email', () => {
      setup('email');
      expect(screen.getByText('Geschriebene E-Mail')).toBeInTheDocument();
    });

    it('zeigt "Erstellte Meetingnotiz" für meeting', () => {
      setup('meeting');
      expect(screen.getByText('Erstellte Meetingnotiz')).toBeInTheDocument();
    });

    it('zeigt "Aufbereiteter Text" für freetext', () => {
      setup('freetext');
      expect(screen.getByText('Aufbereiteter Text')).toBeInTheDocument();
    });
  });

  describe('Leer-Zustand', () => {
    it('zeigt Hinweistext wenn kein Output und nicht am Laden', () => {
      setup('email', undefined, false);
      expect(
        screen.getByText(/Dein aufbereiteter Text erscheint hier/),
      ).toBeInTheDocument();
    });

    it('zeigt keinen Kopier-Button im Leer-Zustand', () => {
      setup('email', undefined, false);
      expect(screen.queryByRole('button', { name: /kopier/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading-Zustand', () => {
    it('zeigt Skeleton während isLoading', () => {
      setup('email', undefined, true);
      // LoadingSkeleton rendert aria-live="polite" status-Region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    it('zeigt keinen Leer-Hinweis während isLoading', () => {
      setup('email', undefined, true);
      expect(
        screen.queryByText(/Dein aufbereiteter Text erscheint hier/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Output-Zustand', () => {
    it('rendert Output-Inhalt', () => {
      setup('email', 'Betreff: Test\n\nHello World');
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('zeigt Kopier-Button wenn Output vorhanden', () => {
      setup('email', 'Betreff: Test\n\nInhalt');
      expect(screen.getByRole('button', { name: 'Text kopieren' })).toBeInTheDocument();
    });

    it('Kopier-Button schreibt Text in die Zwischenablage', async () => {
      const output = 'Betreff: Hallo\n\nIch bin ein Text.';
      setup('email', output);
      await userEvent.click(screen.getByRole('button', { name: 'Text kopieren' }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(output);
    });

    it('Kopier-Button wechselt Label auf "Kopiert!" nach dem Kopieren', async () => {
      setup('email', 'Betreff: Test\n\nInhalt');
      await userEvent.click(screen.getByRole('button', { name: 'Text kopieren' }));
      expect(screen.getByRole('button', { name: 'Text kopiert' })).toBeInTheDocument();
    });
  });
});
