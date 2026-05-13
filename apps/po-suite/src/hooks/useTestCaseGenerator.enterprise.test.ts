import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { TestPlan } from '../types';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

import { fetchApi } from '../shared/services/httpClient';
import { useGenerateTestCases } from './useTestCaseGenerator';
import type { GenerateTestCasesParams } from '../services/testCaseGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

const emptyPlan: TestPlan = {
  story_id: null,
  story_title: 'Mein Testplan',
  generated_at: '2024-01-01T00:00:00.000Z',
  input_sources: { has_screenshot: false, has_test_context: false, screenshot_count: 0 },
  test_cases: [],
  summary: {
    total_count: 0,
    by_type: {},
    by_level: {},
    ak_coverage: [],
    gaps: [],
    risk_flags: [],
  },
};

beforeEach(() => {
  vi.mocked(fetchApi).mockReset();
});

describe('useGenerateTestCases (Enterprise)', () => {
  it('ruft fetchApi mit dem Test-Case-Generator-Endpunkt und params auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(emptyPlan);

    const params: GenerateTestCasesParams = {
      storyText: 'Als Nutzer möchte ich…',
      testContext: 'Mobile First',
      screenshots: [{ base64: 'BASE64', mediaType: 'image/png' }],
    };

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/test-case-generator/generate');
    expect(body).toEqual(params);
  });

  it('liefert den TestPlan aus der API als data', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(emptyPlan);

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    result.current.mutate({ storyText: 'X', screenshots: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.story_title).toBe('Mein Testplan');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Generieren fehlgeschlagen'));

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    result.current.mutate({ storyText: 'X', screenshots: [] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Generieren fehlgeschlagen');
  });
});
