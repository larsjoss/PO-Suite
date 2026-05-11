import { useMutation } from '@tanstack/react-query';
import { generateTestCases, type GenerateTestCasesParams } from '../services/testCaseGenerator';
import { fetchApi } from '../shared/services/httpClient';
import type { TestPlan } from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

export function useGenerateTestCases() {
  return useMutation<TestPlan, Error, GenerateTestCasesParams>({
    mutationFn: (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<TestPlan>('/api/tools/test-case-generator/generate', params);
      }
      return generateTestCases(params);
    },
  });
}
