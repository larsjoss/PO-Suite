import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';

const polishTextMock = vi.fn();

vi.mock('../services/textPolisher', () => ({
  polishText: (...args: unknown[]) => polishTextMock(...args),
}));

import { usePolishText } from './useTextPolisher';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  polishTextMock.mockReset();
});

describe('usePolishText', () => {
  it('startet mit isPending=false und isError=false', () => {
    const { result } = renderHook(() => usePolishText(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('ruft polishText mit input, useCase und tone', async () => {
    polishTextMock.mockResolvedValueOnce('output text');

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'roh', useCase: 'email', tone: 'formell' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(polishTextMock.mock.calls[0]).toEqual(['roh', 'email', 'formell']);
  });

  it('liefert die Service-Response als data', async () => {
    polishTextMock.mockResolvedValueOnce('Mein polierter Text.');

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'x', useCase: 'freetext', tone: 'neutral' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('Mein polierter Text.');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    polishTextMock.mockRejectedValueOnce(new Error('API down'));

    const { result } = renderHook(() => usePolishText(), { wrapper });
    result.current.mutate({ input: 'x', useCase: 'meeting', tone: 'neutral' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('API down');
  });
});
