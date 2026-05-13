import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { Story, StoryDetailResponse } from '../types';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

import { fetchApi, fetchApiGet } from '../shared/services/httpClient';
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
  userId: 'user-1',
  title: 'Enterprise Titel',
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
  vi.mocked(fetchApi).mockReset();
  vi.mocked(fetchApiGet).mockReset();
  navigateMock.mockReset();
});

describe('useStory (Enterprise)', () => {
  it('ruft fetchApiGet mit dem Stories-Detail-Endpunkt auf', async () => {
    vi.mocked(fetchApiGet).mockResolvedValueOnce(baseDetailResponse);

    const { result } = renderHook(() => useStory('story-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApiGet).toHaveBeenCalledWith('/api/stories/story-1');
  });

  it('liefert die StoryDetailResponse als data', async () => {
    vi.mocked(fetchApiGet).mockResolvedValueOnce(baseDetailResponse);

    const { result } = renderHook(() => useStory('story-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.story.id).toBe('story-1');
  });

  it('ist deaktiviert wenn id undefined ist', () => {
    const { result } = renderHook(() => useStory(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchApiGet).not.toHaveBeenCalled();
  });

  it('setzt isError=true wenn fetchApiGet rejectet', async () => {
    vi.mocked(fetchApiGet).mockRejectedValueOnce(new Error('Story nicht gefunden'));

    const { result } = renderHook(() => useStory('missing'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Story nicht gefunden');
  });
});

describe('useGenerateStory (Enterprise)', () => {
  it('ruft fetchApi mit dem Generate-Endpunkt und rawInput auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Roh-Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchApi).toHaveBeenCalledWith('/api/tools/story/generate', { rawInput: 'Roh-Eingabe' });
  });

  it('liefert die Story aus der API als data', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('story-1');
  });

  it('navigiert nach Erfolg zur Story-Detailseite', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Eingabe');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(navigateMock).toHaveBeenCalledWith('/tools/story-generator/story-1');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Backend nicht erreichbar'));

    const { result } = renderHook(() => useGenerateStory(), { wrapper });
    result.current.mutate('Eingabe');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Backend nicht erreichbar');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe('useRefineStoryWithHints (Enterprise)', () => {
  const hintAnswers = [{ hint: 'Was ist das Ziel?', answer: 'Bessere UX' }];
  const params = {
    currentStory: 'Aktuelle Story',
    hintAnswers,
    currentTitle: 'Aktueller Titel',
  };

  it('ruft fetchApi mit dem refine-hints-Endpunkt und gecachter storyId auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData(['story', 'story-1'], baseDetailResponse);

    const wrapperWithClient = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), {
      wrapper: wrapperWithClient,
    });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/story/refine-hints');
    expect(body).toEqual({
      currentStory: 'Aktuelle Story',
      hintAnswers,
      storyId: 'story-1',
    });
  });

  it('verwendet die übergebene id als Fallback wenn kein Cache vorhanden ist', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStoryWithHints('fallback-id'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = vi.mocked(fetchApi).mock.calls[0][1] as { storyId: string };
    expect(body.storyId).toBe('fallback-id');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Refine-Hints fehlgeschlagen'));

    const { result } = renderHook(() => useRefineStoryWithHints('story-1'), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Refine-Hints fehlgeschlagen');
  });
});

describe('useRefineStory (Enterprise)', () => {
  it('ruft fetchApi mit dem refine-Endpunkt und conversationHistory aus dem Cache auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData(['story', 'story-1'], baseDetailResponse);

    const wrapperWithClient = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useRefineStory('story-1'), {
      wrapper: wrapperWithClient,
    });
    result.current.mutate('Bitte kürzer fassen');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/story/refine');

    const typedBody = body as {
      conversationHistory: Array<{ role: string; content: string }>;
      storyId: string;
      instruction: string;
    };
    expect(typedBody.storyId).toBe('story-1');
    expect(typedBody.instruction).toBe('Bitte kürzer fassen');
    expect(typedBody.conversationHistory[0]).toEqual({ role: 'user', content: 'Roh-Eingabe' });
    expect(typedBody.conversationHistory[1].role).toBe('assistant');
    expect(typedBody.conversationHistory[1].content).toContain('Generierte Story');
    expect(typedBody.conversationHistory[typedBody.conversationHistory.length - 1]).toEqual({
      role: 'user',
      content: 'Bitte kürzer fassen',
    });
  });

  it('baut eine minimale conversationHistory ohne Story-Cache', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(baseStory);

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Erste Instruktion');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = vi.mocked(fetchApi).mock.calls[0][1] as {
      conversationHistory: Array<{ role: string; content: string }>;
    };
    expect(body.conversationHistory).toEqual([{ role: 'user', content: 'Erste Instruktion' }]);
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Refine fehlgeschlagen'));

    const { result } = renderHook(() => useRefineStory('story-1'), { wrapper });
    result.current.mutate('Anweisung');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Refine fehlgeschlagen');
  });
});
