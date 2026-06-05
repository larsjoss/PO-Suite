import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { StoryOutputPanel } from './StoryOutputPanel';
import type { Story } from '../../types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'story-1',
    userId: 'user-1',
    title: 'Test Story',
    rawInput: 'Anforderung',
    generatedStory: '**Titel**\n\nEine User Story.',
    refinementHints: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('StoryOutputPanel', () => {
  describe('Leer-Zustand', () => {
    it('zeigt Hinweistext wenn keine Story und nicht am Laden', () => {
      renderWithRouter(<StoryOutputPanel />);
      expect(
        screen.getByText(/Gib eine Anforderung ein/),
      ).toBeInTheDocument();
    });

    it('zeigt keinen Kopier-Button im Leer-Zustand', () => {
      renderWithRouter(<StoryOutputPanel />);
      expect(screen.queryByRole('button', { name: /kopier/i })).not.toBeInTheDocument();
    });
  });

  describe('Loading-Zustand', () => {
    it('zeigt Skeleton während isLoading', () => {
      renderWithRouter(<StoryOutputPanel isLoading />);
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    it('zeigt Skeleton während isGenerating ohne Story', () => {
      renderWithRouter(<StoryOutputPanel isGenerating />);
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    it('zeigt keinen Leer-Hinweis während isLoading', () => {
      renderWithRouter(<StoryOutputPanel isLoading />);
      expect(screen.queryByText(/Gib eine Anforderung ein/)).not.toBeInTheDocument();
    });
  });

  describe('Refinement-Banner', () => {
    it('zeigt Refinement-Banner wenn isRefining', () => {
      renderWithRouter(<StoryOutputPanel story={makeStory()} isRefining />);
      expect(screen.getByText('Story wird verfeinert…')).toBeInTheDocument();
    });

    it('zeigt keinen Refinement-Banner wenn nicht isRefining', () => {
      renderWithRouter(<StoryOutputPanel story={makeStory()} />);
      expect(screen.queryByText('Story wird verfeinert…')).not.toBeInTheDocument();
    });
  });

  describe('Story-Inhalt', () => {
    it('rendert Story-Text wenn Story vorhanden', () => {
      renderWithRouter(<StoryOutputPanel story={makeStory({ generatedStory: 'Meine Story' })} />);
      expect(screen.getByText('Meine Story')).toBeInTheDocument();
    });

    it('zeigt Kopier-Button wenn Story vorhanden', () => {
      renderWithRouter(<StoryOutputPanel story={makeStory()} />);
      expect(screen.getByRole('button', { name: 'Story kopieren' })).toBeInTheDocument();
    });

    it('Kopier-Button schreibt generatedStory in die Zwischenablage', async () => {
      const story = makeStory({ generatedStory: 'Kopierinhalt' });
      renderWithRouter(<StoryOutputPanel story={story} />);
      await userEvent.click(screen.getByRole('button', { name: 'Story kopieren' }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Kopierinhalt');
    });

    it('Kopier-Button wechselt Label auf "Story kopiert" nach dem Kopieren', async () => {
      renderWithRouter(<StoryOutputPanel story={makeStory()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Story kopieren' }));
      expect(screen.getByRole('button', { name: 'Story kopiert' })).toBeInTheDocument();
    });
  });
});
