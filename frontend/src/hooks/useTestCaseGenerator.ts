import { useMutation } from '@tanstack/react-query';
import { generateTestCases, type GenerateTestCasesParams } from '../services/testCaseGenerator';
import type { TestPlan } from '../types';

export function useGenerateTestCases() {
  return useMutation<TestPlan, Error, GenerateTestCasesParams>({
    mutationFn: generateTestCases,
  });
}
