import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type { TestPlan } from '../types';

const generateTestCasesMock = vi.fn();

vi.mock('../services/testCaseGenerator', () => ({
  generateTestCases: (...args: unknown[]) => generateTestCasesMock(...args),
}));

import { useGenerateTestCases } from './useTestCaseGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

const samplePlan: TestPlan = {
  story_id: null,
  story_title: 'Login',
  generated_at: '2026-05-07T00:00:00.000Z',
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
  generateTestCasesMock.mockReset();
});

describe('useGenerateTestCases', () => {
  it('ruft generateTestCases mit den Params', async () => {
    generateTestCasesMock.mockResolvedValueOnce(samplePlan);

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    const params = { storyText: 'Story', screenshots: [] };
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(generateTestCasesMock.mock.calls[0][0]).toEqual(params);
  });

  it('liefert TestPlan als data', async () => {
    generateTestCasesMock.mockResolvedValueOnce(samplePlan);

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    result.current.mutate({ storyText: 'Story', screenshots: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.story_title).toBe('Login');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    generateTestCasesMock.mockRejectedValueOnce(new Error('Boom'));

    const { result } = renderHook(() => useGenerateTestCases(), { wrapper });
    result.current.mutate({ storyText: 'Story', screenshots: [] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Boom');
  });
});
