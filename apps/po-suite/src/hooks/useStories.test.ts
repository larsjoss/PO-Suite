import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { StoriesResponse } from '../types';

const getStoriesMock = vi.fn();
const deleteStoryMock = vi.fn();

vi.mock('../services/storage', () => ({
  getStories: (...args: unknown[]) => getStoriesMock(...args),
  deleteStory: (...args: unknown[]) => deleteStoryMock(...args),
}));

import { useStories, useDeleteStory } from './useStories';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

const emptyResponse: StoriesResponse = { stories: [], total: 0 };

beforeEach(() => {
  getStoriesMock.mockReset();
  deleteStoryMock.mockReset();
});

describe('useStories', () => {
  it('ruft storage.getStories mit dem Suchbegriff auf', async () => {
    getStoriesMock.mockReturnValue(emptyResponse);

    const { result } = renderHook(() => useStories('Suche'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStoriesMock).toHaveBeenCalledWith('Suche');
  });

  it('ruft storage.getStories mit einem leeren String auf', async () => {
    getStoriesMock.mockReturnValue(emptyResponse);

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getStoriesMock).toHaveBeenCalledWith('');
  });

  it('liefert StoriesResponse als data', async () => {
    const response: StoriesResponse = {
      stories: [
        {
          id: 'story-1',
          userId: '1',
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
    getStoriesMock.mockReturnValue(response);

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.stories[0].id).toBe('story-1');
  });

  it('liefert eine leere Liste wenn keine Stories vorhanden sind', async () => {
    getStoriesMock.mockReturnValue(emptyResponse);

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.stories).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it('setzt isError=true wenn storage.getStories eine Exception wirft', async () => {
    getStoriesMock.mockImplementation(() => {
      throw new Error('localStorage nicht verfügbar');
    });

    const { result } = renderHook(() => useStories(''), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('localStorage nicht verfügbar');
  });
});

describe('useDeleteStory', () => {
  it('ruft storage.deleteStory mit der id auf', async () => {
    deleteStoryMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useDeleteStory(), { wrapper });
    result.current.mutate('story-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteStoryMock).toHaveBeenCalledWith('story-1');
  });

  it('invalidiert die stories-Query nach erfolgreichem Löschen', async () => {
    deleteStoryMock.mockReturnValue(undefined);
    getStoriesMock.mockReturnValue(emptyResponse);

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

  it('startet mit isPending=false und isError=false', () => {
    const { result } = renderHook(() => useDeleteStory(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    deleteStoryMock.mockImplementation(() => {
      throw new Error('Löschen fehlgeschlagen');
    });

    const { result } = renderHook(() => useDeleteStory(), { wrapper });
    result.current.mutate('story-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Löschen fehlgeschlagen');
  });
});
