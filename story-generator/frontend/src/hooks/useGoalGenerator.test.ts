import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import type {
  GenerateGoalParams,
  GenerateGoalResult,
  RefineGoalParams,
  RefineGoalResult,
} from '../types';

const generateGoalsMock = vi.fn();
const refineGoalMock = vi.fn();

vi.mock('../services/goalGenerator', () => ({
  generateGoals: (...args: unknown[]) => generateGoalsMock(...args),
  refineGoal: (...args: unknown[]) => refineGoalMock(...args),
}));

import { useGenerateGoals, useRefineGoal } from './useGoalGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  generateGoalsMock.mockReset();
  refineGoalMock.mockReset();
});

describe('useGenerateGoals', () => {
  const params: GenerateGoalParams = {
    mode: 'sprint-goal',
    input: { idea: 'Mehr Fokus auf Onboarding' },
    screenshot: null,
  };

  const result: GenerateGoalResult = {
    variants: [{ text: 'Goal eins.', rationale: 'gut' }],
    rawText: 'raw',
  };

  it('ruft generateGoals mit den Params', async () => {
    generateGoalsMock.mockResolvedValueOnce(result);

    const { result: hook } = renderHook(() => useGenerateGoals(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isSuccess).toBe(true));
    expect(generateGoalsMock.mock.calls[0][0]).toEqual(params);
  });

  it('liefert GenerateGoalResult als data', async () => {
    generateGoalsMock.mockResolvedValueOnce(result);

    const { result: hook } = renderHook(() => useGenerateGoals(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isSuccess).toBe(true));
    expect(hook.current.data?.variants).toHaveLength(1);
    expect(hook.current.data?.variants[0].text).toBe('Goal eins.');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    generateGoalsMock.mockRejectedValueOnce(new Error('Goals failed'));

    const { result: hook } = renderHook(() => useGenerateGoals(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isError).toBe(true));
    expect(hook.current.error?.message).toBe('Goals failed');
  });
});

describe('useRefineGoal', () => {
  const params: RefineGoalParams = {
    mode: 'sprint-goal',
    input: { idea: 'idea' },
    screenshot: null,
    rawInitialResponse: 'initial',
    selectedVariantText: 'gewählt',
    refinementHint: 'kürzer',
    previousRefinements: [],
  };

  const result: RefineGoalResult = {
    variant: { text: 'Verfeinert.', rationale: 'schärfer' },
    rawText: 'raw',
    userMessage: 'msg',
  };

  it('ruft refineGoal mit den Params', async () => {
    refineGoalMock.mockResolvedValueOnce(result);

    const { result: hook } = renderHook(() => useRefineGoal(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isSuccess).toBe(true));
    expect(refineGoalMock.mock.calls[0][0]).toEqual(params);
  });

  it('liefert RefineGoalResult als data', async () => {
    refineGoalMock.mockResolvedValueOnce(result);

    const { result: hook } = renderHook(() => useRefineGoal(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isSuccess).toBe(true));
    expect(hook.current.data?.variant.text).toBe('Verfeinert.');
  });

  it('setzt isError=true bei Service-Fehler', async () => {
    refineGoalMock.mockRejectedValueOnce(new Error('Refine failed'));

    const { result: hook } = renderHook(() => useRefineGoal(), { wrapper });
    hook.current.mutate(params);

    await waitFor(() => expect(hook.current.isError).toBe(true));
    expect(hook.current.error?.message).toBe('Refine failed');
  });
});
