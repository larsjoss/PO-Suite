import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { generateTestCases, type GenerateTestCasesParams } from '../services/testCaseGenerator';
import { createTestPlan } from '../services/testCaseStorage';
import { fetchApi } from '../shared/services/httpClient';
import type { StoredTestPlan, TestPlan } from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

export function useGenerateTestCases() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<StoredTestPlan | TestPlan, Error, GenerateTestCasesParams>({
    mutationFn: async (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<TestPlan>('/api/tools/test-case-generator/generate', params);
      }
      const plan = await generateTestCases(params);
      return createTestPlan(plan, params.storyText);
    },
    onSuccess: (result) => {
      if (!IS_ENTERPRISE) {
        queryClient.invalidateQueries({ queryKey: ['tcg-plans'] });
        navigate(`/tools/test-case-generator/${(result as StoredTestPlan).id}`);
      }
    },
  });
}
