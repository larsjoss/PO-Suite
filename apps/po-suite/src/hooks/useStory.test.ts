import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { Story, StoryDetailResponse } from '../types';
import type * as ClaudeModule from '../services/claude';

const getStoryMock = vi.fn();
const createStoryMock = vi.fn();
const updateStoryMock = vi.fn();
const addRefinementMock = vi.fn();

vi.mock('../services/storage', () => ({
  getStory: (...args: unknown[]) => getStoryMock(...args),
  createStory: (...args: unknown[]) => createStoryMock(...args),
  updateStory: (...args: unknown[]) => updateStoryMock(...args),
  addRefinement: (...args: unknown[]) => addRefinementMock(...args),
}));

const generateStoryMock = vi.fn();
const extractTitleMock = vi.fn();
const refineStoryWithHintsMock = vi.fn();
const refineStoryMock = vi.fn();

vi.mock('../services/claude', async (importOriginal) => {
  const actual = await importOriginal<typeof ClaudeModule>();
  return {
    ...actual,
    generateStory: (...args: unknown[]) => generateStoryMock(...args),
    extractTitle: (...args: unknown[]) => extractTitleMock(...args),
    refineStoryWithHints: (...args: unknown[]) => refineStoryWithHintsMock(...args),
    refineStory: (...args: unknown[]) => refineStoryMock(...args),
  };
});

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

import { useStory, useGenerateStory, useRefineStoryWithHints, useRefineStory } from './useStory';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: makeClient() }, children);
}

const baseStory: Story = {
  id: 'story-1',
  userId: '1',
  title: 'Testtitel',
  rawInput: 'Roh-Eingabe',
  generatedStory: 'Generierte Story',
  refinementHints: 'Hinweis 1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const baseDetailResponse: StoryDetailResponse = {
  story: baseStory,
  refinements: [],
};

beforeEach(() => {
  getStoryMock.mockReset();
  createStoryMock.mockReset();
  updateStoryMock.mockReset();
  addRefinementMock.mockReset();
  generateStoryMock.mockReset();
  extractTitleMock.mockReset();
  refineStoryWithHintsMock.mockReset();
  refineStoryMock.mockReset();
  navigateMock.mockReset();
});

describe('useStory', () => {
  it('startet mit isPending=true wenn id definiert ist', () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    const { result } = renderHook(() => useStory('story-1'), { wrapper });
    expect(result.current.isPending).toBe(true);
  });

  it('ruft storage.getStory mit der id auf', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    const { result } = renderHook(() => useStory('story-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoryMock).toHaveBeenCalledWith('story-1');
  });

  it('liefert StoryDetailResponse als data', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    const { result } = renderHook(() => useStory('story-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.story.id).toBe('story-1');
    expect(result.current.data?.refinements).toHaveLength(0);
  });

  it('ist deaktiviert wenn id undefined ist', () => {
    const { result } = renderHook(() => useStory(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getStoryMock).not.toHaveBeenCalled();
  });

  it('setzt isError=true wenn storage.getStory eine Exception wirft', async () => {
    getStoryMock.mockImplementation(() => {
      throw new Error('Story nicht gefunden');
    });
    const { result } = renderHook(() => useStory('nicht-vorhanden'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Story nicht gefunden');
  });
});

describe('useGenerateStory', () => {
  it('ruft claude.generateStory mit dem rawInput auf', async () => {
    generateStoryMock.mockResolvedValueOnce({
      generatedStory: 'Als Nutzer möchte ich...',
      refinementHints: 'Hinweis',
    });
    extractTitleMock.mockReturnValueOnce('Abgeleiteter Titel');
    createStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Roh-Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(generateStoryMock).toHaveBeenCalledWith('Roh-Eingabe', '', '');
  });

  it('ruft claude.extractTitle mit generatedStory und rawInput auf', async () => {
    generateStoryMock.mockResolvedValueOnce({
      generatedStory: 'Als Nutzer möchte ich...',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Abgeleiteter Titel');
    createStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Roh-Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(extractTitleMock).toHaveBeenCalledWith('Als Nutzer möchte ich...', 'Roh-Eingabe');
  });

  it('ruft storage.createStory mit title, rawInput, generatedStory und refinementHints auf', async () => {
    generateStoryMock.mockResolvedValueOnce({
      generatedStory: 'Als Nutzer möchte ich...',
      refinementHints: 'Hinweis A',
    });
    extractTitleMock.mockReturnValueOnce('Mein Titel');
    createStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Roh-Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createStoryMock).toHaveBeenCalledWith(
      'Mein Titel',
      'Roh-Eingabe',
      'Als Nutzer möchte ich...',
      'Hinweis A',
    );
  });

  it('navigiert nach Erfolg zur Story-Detailseite', async () => {
    generateStoryMock.mockResolvedValueOnce({
      generatedStory: 'Story Text',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Titel');
    createStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(navigateMock).toHaveBeenCalledWith('/tools/story-generator/story-1');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    generateStoryMock.mockRejectedValueOnce(new Error('API nicht verfügbar'));

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Eingabe');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('API nicht verfügbar');
  });
});

describe('useRefineStoryWithHints', () => {
  const hintAnswers = [{ hint: 'Was ist das Ziel?', answer: 'Bessere UX' }];
  const params = {
    currentStory: 'Aktuelle Story',
    hintAnswers,
    currentTitle: 'Aktueller Titel',
  };

  it('ruft claude.refineStoryWithHints mit currentStory und hintAnswers auf', async () => {
    refineStoryWithHintsMock.mockResolvedValueOnce({
      generatedStory: 'Verfeinerte Story',
      refinementHints: 'Neue Hinweise',
    });
    extractTitleMock.mockReturnValueOnce('Neuer Titel');
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(refineStoryWithHintsMock).toHaveBeenCalledWith('Aktuelle Story', hintAnswers, '', '');
  });

  it('ruft claude.extractTitle mit generatedStory und currentTitle auf', async () => {
    refineStoryWithHintsMock.mockResolvedValueOnce({
      generatedStory: 'Verfeinerte Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Extrahierter Titel');
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(extractTitleMock).toHaveBeenCalledWith('Verfeinerte Story', 'Aktueller Titel');
  });

  it('ruft storage.updateStory mit id, generatedStory, refinementHints und title auf', async () => {
    refineStoryWithHintsMock.mockResolvedValueOnce({
      generatedStory: 'Verfeinerte Story',
      refinementHints: 'Hinweis B',
    });
    extractTitleMock.mockReturnValueOnce('Titel B');
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateStoryMock).toHaveBeenCalledWith(
      'story-1',
      'Verfeinerte Story',
      'Hinweis B',
      'Titel B',
    );
  });

  it('aktualisiert den Query-Cache für die Story nach Erfolg', async () => {
    const updatedStory: Story = { ...baseStory, title: 'Aktualisiert' };
    refineStoryWithHintsMock.mockResolvedValueOnce({
      generatedStory: 'Verfeinerte Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Aktualisiert');
    updateStoryMock.mockReturnValueOnce(updatedStory);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const initialCache: StoryDetailResponse = {
      story: baseStory,
      refinements: [],
    };
    client.setQueryData(['story', 'story-1'], initialCache);

    const wrapperWithClient = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), {
      wrapper: wrapperWithClient,
    });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = client.getQueryData<StoryDetailResponse>(['story', 'story-1']);
    expect(cached?.story.title).toBe('Aktualisiert');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    refineStoryWithHintsMock.mockRejectedValueOnce(new Error('Hinweis-Fehler'));

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Hinweis-Fehler');
  });
});

describe('useRefineStory', () => {
  it('ruft storage.getStory auf, um die Conversation-History aufzubauen', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Neue Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Neuer Titel');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Bitte kürzer fassen');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getStoryMock).toHaveBeenCalledWith('story-1');
  });

  it('übergibt eine korrekte Conversation-History mit story und instruction an claude.refineStory', async () => {
    getStoryMock.mockReturnValue({
      story: baseStory,
      refinements: [],
    });
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Neue Story',
      refinementHints: 'Neue Hinweise',
    });
    extractTitleMock.mockReturnValueOnce('Neuer Titel');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Bitte kürzer fassen');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const conversationHistory = refineStoryMock.mock.calls[0][0];
    expect(conversationHistory[0]).toEqual({ role: 'user', content: 'Roh-Eingabe' });
    expect(conversationHistory[1].role).toBe('assistant');
    expect(conversationHistory[1].content).toContain('Generierte Story');
    expect(conversationHistory[1].content).toContain('Hinweis 1');
    expect(conversationHistory[conversationHistory.length - 1]).toEqual({
      role: 'user',
      content: 'Bitte kürzer fassen',
    });
  });

  it('fügt Refinement-Logs korrekt in die Conversation-History ein', async () => {
    getStoryMock.mockReturnValue({
      story: baseStory,
      refinements: [
        {
          id: 'ref-1',
          storyId: 'story-1',
          instruction: 'Erste Verfeinerung',
          resultStory: 'Erstes Ergebnis',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Dritte Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Dritter Titel');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Zweite Verfeinerung');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const conversationHistory = refineStoryMock.mock.calls[0][0];
    expect(conversationHistory).toContainEqual({ role: 'user', content: 'Erste Verfeinerung' });
    expect(conversationHistory).toContainEqual({ role: 'assistant', content: 'Erstes Ergebnis' });
    expect(conversationHistory[conversationHistory.length - 1]).toEqual({
      role: 'user',
      content: 'Zweite Verfeinerung',
    });
  });

  it('ruft storage.addRefinement mit id, instruction und generatedStory auf', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Neue Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Titel');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Bitte ausführlicher');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addRefinementMock).toHaveBeenCalledWith('story-1', 'Bitte ausführlicher', 'Neue Story');
  });

  it('ruft storage.updateStory nach addRefinement auf', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Neue Story',
      refinementHints: 'Neue Hinweise',
    });
    extractTitleMock.mockReturnValueOnce('Neuer Titel');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Bitte kürzer');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateStoryMock).toHaveBeenCalledWith(
      'story-1',
      'Neue Story',
      'Neue Hinweise',
      'Neuer Titel',
    );
  });

  it('aktualisiert den Query-Cache für die Story nach Erfolg', async () => {
    const updatedStory: Story = { ...baseStory, title: 'Nach Refinement' };
    getStoryMock.mockReturnValue(baseDetailResponse);
    refineStoryMock.mockResolvedValueOnce({
      generatedStory: 'Neue Story',
      refinementHints: '',
    });
    extractTitleMock.mockReturnValueOnce('Nach Refinement');
    addRefinementMock.mockReturnValueOnce({});
    updateStoryMock.mockReturnValueOnce(updatedStory);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const initialCache: StoryDetailResponse = { story: baseStory, refinements: [] };
    client.setQueryData(['story', 'story-1'], initialCache);

    const wrapperWithClient = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useRefineStory('story-1'), {
      wrapper: wrapperWithClient,
    });
    result.current.mutate('Bitte anpassen');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = client.getQueryData<StoryDetailResponse>(['story', 'story-1']);
    expect(cached?.story.title).toBe('Nach Refinement');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    getStoryMock.mockReturnValue(baseDetailResponse);
    refineStoryMock.mockRejectedValueOnce(new Error('Refine fehlgeschlagen'));

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Anweisung');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Refine fehlgeschlagen');
  });
});
