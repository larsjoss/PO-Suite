import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { GenerateDocParams, UploadedFile } from '../types';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

import { fetchApi } from '../shared/services/httpClient';
import { useGenerateDoc } from './useDocGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

function makeUploadedFile(name: string, mediaType: string, base64: string): UploadedFile {
  return {
    id: `id-${name}`,
    file: new File(['x'], name, { type: mediaType }),
    previewUrl: `blob:${name}`,
    base64,
  };
}

beforeEach(() => {
  vi.mocked(fetchApi).mockReset();
});

describe('useGenerateDoc (Enterprise)', () => {
  it('ruft fetchApi mit dem Doc-Generator-Endpunkt für Story-Modus auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ result: '# Generierte Story-Doku' });

    const params: GenerateDocParams = {
      mode: 'story',
      input: {
        title: 'Titel',
        description: 'Beschreibung',
        confluenceSpec: '',
        code: '',
        acceptedBy: '',
        deploymentDate: '',
      },
      screenshots: [],
    };

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/doc-generator/generate');
    expect(body).toEqual({
      mode: 'story',
      input: params.input,
      screenshots: [],
    });
  });

  it('mappt UploadedFile[] zu base64 + mediaType für den Backend-Payload', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ result: '# Doku' });

    const params: GenerateDocParams = {
      mode: 'feature',
      input: {
        title: 'Feature-Titel',
        description: 'Feature-Beschreibung',
        stories: 'STORY-1',
        confluenceSpec: '',
        code: '',
        responsible: '',
        deploymentDate: '',
        decisions: '',
      },
      screenshots: [makeUploadedFile('shot.png', 'image/png', 'BASE64PNG')],
    };

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = vi.mocked(fetchApi).mock.calls[0][1] as {
      screenshots: Array<{ base64: string; mediaType: string }>;
    };
    expect(body.screenshots).toEqual([{ base64: 'BASE64PNG', mediaType: 'image/png' }]);
  });

  it('liefert nur res.result als data zurück', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ result: '# Mein Markdown' });

    const params: GenerateDocParams = {
      mode: 'story',
      input: {
        title: 'T',
        description: 'D',
        confluenceSpec: '',
        code: '',
        acceptedBy: '',
        deploymentDate: '',
      },
      screenshots: [],
    };

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('# Mein Markdown');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Serverfehler (500)'));

    const params: GenerateDocParams = {
      mode: 'story',
      input: {
        title: 'T',
        description: 'D',
        confluenceSpec: '',
        code: '',
        acceptedBy: '',
        deploymentDate: '',
      },
      screenshots: [],
    };

    const { result } = renderHook(() => useGenerateDoc(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Serverfehler (500)');
  });
});
