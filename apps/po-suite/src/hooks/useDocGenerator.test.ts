import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { GenerateDocParams } from '../types';

const generateDocMock = vi.fn();

vi.mock('../services/docGenerator', () => ({
  generateDoc: (...args: unknown[]) => generateDocMock(...args),
}));

import { useGenerateDoc } from './useDocGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

const baseParams: GenerateDocParams = {
  mode: 'story',
  input: {
    title: 'Mein Titel',
    description: 'Beschreibung',
    confluenceSpec: '',
    code: '',
    acceptedBy: '',
    deploymentDate: '',
  },
  screenshots: [],
};

beforeEach(() => {
  generateDocMock.mockReset();
});

describe('useGenerateDoc', () => {
  it('ruft generateDoc mit den Mutation-Params', async () => {
    generateDocMock.mockResolvedValueOnce('# Doku');

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(baseParams);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(generateDocMock.mock.calls[0][0]).toEqual(baseParams);
  });

  it('liefert das Markdown als data', async () => {
    generateDocMock.mockResolvedValueOnce('# Mein Doku-Output');

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(baseParams);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('# Mein Doku-Output');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    generateDocMock.mockRejectedValueOnce(new Error('Generation fehlgeschlagen'));

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(baseParams);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Generation fehlgeschlagen');
  });
});
