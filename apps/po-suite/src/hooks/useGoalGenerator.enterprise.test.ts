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
  UploadedFile,
} from '../types';

vi.mock('../shared/services/httpClient', () => ({
  fetchApi: vi.fn(),
  fetchApiGet: vi.fn(),
  fetchApiDelete: vi.fn(),
  setJwt: vi.fn(),
  clearJwt: vi.fn(),
  setOn401Handler: vi.fn(),
}));

import { fetchApi } from '../shared/services/httpClient';
import { useGenerateGoals, useRefineGoal } from './useGoalGenerator';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

function makeUploadedFile(): UploadedFile {
  return {
    id: 'shot-1',
    file: new File(['x'], 'backlog.png', { type: 'image/png' }),
    previewUrl: 'blob:backlog',
    base64: 'BACKLOG_B64',
  };
}

const generateResult: GenerateGoalResult = {
  variants: [
    { text: 'Variante A', rationale: 'Begründung A' },
    { text: 'Variante B', rationale: 'Begründung B' },
  ],
  rawText: 'Raw text',
};

const refineResult: RefineGoalResult = {
  variant: { text: 'Verfeinerte Variante', rationale: 'Verfeinerte Begründung' },
  rawText: 'Refined raw',
  userMessage: 'User-Message',
};

beforeEach(() => {
  vi.mocked(fetchApi).mockReset();
});

describe('useGenerateGoals (Enterprise)', () => {
  it('ruft fetchApi für sprint-goal mit serialisiertem Screenshot auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(generateResult);

    const params: GenerateGoalParams = {
      mode: 'sprint-goal',
      input: { idea: 'Mehr Performance' },
      screenshot: makeUploadedFile(),
    };

    const { result } = renderHook(() => useGenerateGoals(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/goal-generator/generate');
    expect(body).toEqual({
      mode: 'sprint-goal',
      input: { idea: 'Mehr Performance' },
      screenshot: { base64: 'BACKLOG_B64', mediaType: 'image/png' },
    });
  });

  it('lässt sprint-goal-Params unverändert wenn kein Screenshot vorhanden ist', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(generateResult);

    const params: GenerateGoalParams = {
      mode: 'sprint-goal',
      input: { idea: 'Idee' },
      screenshot: null,
    };

    const { result } = renderHook(() => useGenerateGoals(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = vi.mocked(fetchApi).mock.calls[0][1];
    expect(body).toEqual(params);
  });

  it('ruft fetchApi für pi-objective ohne Screenshot-Mapping auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(generateResult);

    const params: GenerateGoalParams = {
      mode: 'pi-objective',
      input: {
        featureTitle: 'F-Titel',
        featureDescription: 'F-Beschreibung',
        jiraReference: 'JIRA-1',
        acceptedBy: 'Person',
        acceptanceDate: '2024-06-01',
        acceptanceLevel: 'PO',
      },
    };

    const { result } = renderHook(() => useGenerateGoals(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/goal-generator/generate');
    expect(body).toEqual(params);
  });

  it('liefert das GenerateGoalResult als data', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(generateResult);

    const { result } = renderHook(() => useGenerateGoals(), { wrapper });
    result.current.mutate({
      mode: 'sprint-goal',
      input: { idea: 'X' },
      screenshot: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.variants).toHaveLength(2);
    expect(result.current.data?.rawText).toBe('Raw text');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Goal-Generate fehlgeschlagen'));

    const { result } = renderHook(() => useGenerateGoals(), { wrapper });
    result.current.mutate({
      mode: 'sprint-goal',
      input: { idea: 'X' },
      screenshot: null,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Goal-Generate fehlgeschlagen');
  });
});

describe('useRefineGoal (Enterprise)', () => {
  const baseRefineBody = {
    rawInitialResponse: 'initial',
    selectedVariantText: 'Variante A',
    refinementHint: 'Bitte konkretisieren',
    previousRefinements: [],
  };

  it('ruft fetchApi für sprint-goal mit serialisiertem Screenshot auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(refineResult);

    const params: RefineGoalParams = {
      ...baseRefineBody,
      mode: 'sprint-goal',
      input: { idea: 'Idee' },
      screenshot: makeUploadedFile(),
    };

    const { result } = renderHook(() => useRefineGoal(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/goal-generator/refine');
    expect(body).toMatchObject({
      mode: 'sprint-goal',
      screenshot: { base64: 'BACKLOG_B64', mediaType: 'image/png' },
      refinementHint: 'Bitte konkretisieren',
    });
  });

  it('ruft fetchApi für pi-objective unverändert auf', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(refineResult);

    const params: RefineGoalParams = {
      ...baseRefineBody,
      mode: 'pi-objective',
      input: {
        featureTitle: 'F',
        featureDescription: 'D',
        jiraReference: 'J',
        acceptedBy: 'A',
        acceptanceDate: '2024-06-01',
        acceptanceLevel: 'L',
      },
    };

    const { result } = renderHook(() => useRefineGoal(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [endpoint, body] = vi.mocked(fetchApi).mock.calls[0];
    expect(endpoint).toBe('/api/tools/goal-generator/refine');
    expect(body).toEqual(params);
  });

  it('liefert das RefineGoalResult als data', async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce(refineResult);

    const params: RefineGoalParams = {
      ...baseRefineBody,
      mode: 'sprint-goal',
      input: { idea: 'X' },
      screenshot: null,
    };

    const { result } = renderHook(() => useRefineGoal(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.variant.text).toBe('Verfeinerte Variante');
  });

  it('setzt isError=true wenn fetchApi rejectet', async () => {
    vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Refine fehlgeschlagen'));

    const params: RefineGoalParams = {
      ...baseRefineBody,
      mode: 'sprint-goal',
      input: { idea: 'X' },
      screenshot: null,
    };

    const { result } = renderHook(() => useRefineGoal(), { wrapper });
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Refine fehlgeschlagen');
  });
});
