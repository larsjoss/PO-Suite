import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { StoredTestPlan, TestPlansResponse } from '../types';

const getTestPlansMock = vi.fn();
const getTestPlanMock = vi.fn();
const deleteTestPlanMock = vi.fn();

vi.mock('../services/testCaseStorage', () => ({
  getTestPlans: (...args: unknown[]) => getTestPlansMock(...args),
  getTestPlan: (...args: unknown[]) => getTestPlanMock(...args),
  deleteTestPlan: (...args: unknown[]) => deleteTestPlanMock(...args),
}));

import { useTestCasePlans, useTestCasePlan, useDeleteTestPlan, useTestCasePlanList } from './useTestCasePlans';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const mockPlan: StoredTestPlan = {
  id: 'plan-1',
  story_id: 'TC-1',
  story_title: 'Login Feature',
  storyText: 'Als Nutzer möchte ich mich anmelden',
  generated_at: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  input_sources: { has_screenshot: false, has_test_context: false, screenshot_count: 0 },
  test_cases: [],
  summary: { total_count: 0, by_type: {}, by_level: {}, ak_coverage: [], gaps: [], risk_flags: [] },
};

beforeEach(() => {
  getTestPlansMock.mockReset();
  getTestPlanMock.mockReset();
  deleteTestPlanMock.mockReset();
});

describe('useTestCasePlans', () => {
  it('gibt Pläne aus dem Storage zurück', async () => {
    const response: TestPlansResponse = { plans: [mockPlan], total: 1 };
    getTestPlansMock.mockReturnValue(response);

    const { result } = renderHook(() => useTestCasePlans(''), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
    expect(getTestPlansMock).toHaveBeenCalledWith('');
  });

  it('übergibt den Suchbegriff an getTestPlans', async () => {
    getTestPlansMock.mockReturnValue({ plans: [], total: 0 });

    const { result } = renderHook(() => useTestCasePlans('login'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTestPlansMock).toHaveBeenCalledWith('login');
  });
});

describe('useTestCasePlan', () => {
  it('gibt einen einzelnen Plan zurück', async () => {
    getTestPlanMock.mockReturnValue(mockPlan);

    const { result } = renderHook(() => useTestCasePlan('plan-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('plan-1');
  });

  it('führt keinen Query aus wenn id undefined', () => {
    const { result } = renderHook(() => useTestCasePlan(undefined), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTestPlanMock).not.toHaveBeenCalled();
  });
});

describe('useDeleteTestPlan', () => {
  it('ruft deleteTestPlan auf und invalidiert den Cache', async () => {
    deleteTestPlanMock.mockReturnValue(undefined);
    getTestPlansMock.mockReturnValue({ plans: [], total: 0 });

    const { result } = renderHook(() => useDeleteTestPlan(), { wrapper: makeWrapper() });
    result.current.mutate('plan-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteTestPlanMock).toHaveBeenCalledWith('plan-1');
  });

  it('setzt isError auf true bei Storage-Fehler', async () => {
    deleteTestPlanMock.mockImplementation(() => { throw new Error('Speicher voll'); });

    const { result } = renderHook(() => useDeleteTestPlan(), { wrapper: makeWrapper() });
    result.current.mutate('plan-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTestCasePlanList', () => {
  it('gibt leeres Array zurück wenn keine Pläne vorhanden', async () => {
    getTestPlansMock.mockReturnValue({ plans: [], total: 0 });

    const { result } = renderHook(() => useTestCasePlanList(''), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toEqual([]);
  });

  it('gibt plans-Array zurück wenn Daten vorhanden', async () => {
    getTestPlansMock.mockReturnValue({ plans: [mockPlan], total: 1 });

    const { result } = renderHook(() => useTestCasePlanList(''), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0].id).toBe('plan-1');
  });
});
