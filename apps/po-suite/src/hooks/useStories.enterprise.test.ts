import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { StoriesResponse } from '../types';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

import { fetchApiGet, fetchApiDelete } from '../shared/services/httpClient';
import { useStories, useDeleteStory } from './useStories';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: makeClient() }, children);
}

const emptyResponse: StoriesResponse = { stories: [], total: 0 };

beforeEach(() => {
  vi.mocked(fetchApiGet).mockReset();
  vi.mocked(fetchApiDelete).mockReset();
});

describe('useStories (Enterprise)', () => {
  it('ruft fetchApiGet ohne Query-String bei leerem Suchbegriff auf', async () => {
    vi.mocked(fetchApiGet).mockResolvedValueOnce(emptyResponse);

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApiGet).toHaveBeenCalledWith('/api/stories');
  });

  it('ruft fetchApiGet ohne Query-String bei rein whitespace-Suchbegriff auf', async () => {
    vi.mocked(fetchApiGet).mockResolvedValueOnce(emptyResponse);

    const { result } = renderHook(() => useStories('   '), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApiGet).toHaveBeenCalledWith('/api/stories');
  });

  it('hängt q-Parameter URL-encoded an wenn ein Suchbegriff vorhanden ist', async () => {
    vi.mocked(fetchApiGet).mockResolvedValueOnce(emptyResponse);

    const { result } = renderHook(() => useStories('Mein Suchbegriff'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApiGet).toHaveBeenCalledWith('/api/stories?q=Mein%20Suchbegriff');
  });

  it('liefert StoriesResponse als data', async () => {
    const response: StoriesResponse = {
      stories: [
        {
          id: 'story-1',
          userId: 'user-1',
          title: 'Story Eins',
          rawInput: 'Eingabe',
          generatedStory: 'Generiert',
          refinementHints: '',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    };
    vi.mocked(fetchApiGet).mockResolvedValueOnce(response);

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.stories[0].id).toBe('story-1');
  });

  it('setzt isError=true wenn fetchApiGet rejectet', async () => {
    vi.mocked(fetchApiGet).mockRejectedValueOnce(new Error('Serverfehler (500)'));

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Serverfehler (500)');
  });
});

describe('useDeleteStory (Enterprise)', () => {
  it('ruft fetchApiDelete mit dem Story-Endpunkt auf', async () => {
    vi.mocked(fetchApiDelete).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteStory(), { wrapper });
    result.current.mutate('story-42');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchApiDelete).toHaveBeenCalledWith('/api/stories/story-42');
  });

  it('invalidiert die stories-Query nach erfolgreichem Löschen', async () => {
    vi.mocked(fetchApiDelete).mockResolvedValueOnce(undefined);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const wrapperWithClient = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(() => useDeleteStory(), { wrapper: wrapperWithClient });
    result.current.mutate('story-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['stories'] });
  });

  it('setzt isError=true wenn fetchApiDelete rejectet', async () => {
    vi.mocked(fetchApiDelete).mockRejectedValueOnce(new Error('Löschen fehlgeschlagen'));

    const { result } = renderHook(() => useDeleteStory(), { wrapper });
    result.current.mutate('story-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Löschen fehlgeschlagen');
  });
});
