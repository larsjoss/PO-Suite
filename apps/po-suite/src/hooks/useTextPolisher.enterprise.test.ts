import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

import { fetchApi } from '../shared/services/httpClient';
import { usePolishText } from './useTextPolisher';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.mocked(fetchApi).mockReset();
});

describe('usePolishText (Enterprise)', () => {
  it('ruft fetchApi mit dem Text-Polisher-Endpunkt und input/useCase/tone auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ result: 'Polierter Text' });

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'roh', useCase: 'email', tone: 'formell' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/text-polisher/polish');
    expect(body).toEqual({ input: 'roh', useCase: 'email', tone: 'formell' });
  });

  it('liefert nur res.result als data zurück', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ result: 'Mein polierter Text.' });

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'x', useCase: 'freetext', tone: 'neutral' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('Mein polierter Text.');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Polish fehlgeschlagen'));

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'x', useCase: 'meeting', tone: 'neutral' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Polish fehlgeschlagen');
  });
});
