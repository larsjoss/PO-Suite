import { useMutation } from '@tanstack/react-query';
import { generateGoals, refineGoal } from '../services/goalGenerator';
import { fetchApi } from '../shared/services/httpClient';
import type {
  GenerateGoalParams,
  GenerateGoalResult,
  RefineGoalParams,
  RefineGoalResult,
} from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

function serializeGoalParams(params: GenerateGoalParams | RefineGoalParams) {
  if (params.mode === 'sprint-goal' && params.screenshot) {
    return {
      ...params,
      screenshot: {
        base64: params.screenshot.base64,
        mediaType: params.screenshot.file.type as 'image/png' | 'image/jpeg' | 'image/webp',
      },
    };
  }
  return params;
}

export function useGenerateGoals() {
  return useMutation<GenerateGoalResult, Error, GenerateGoalParams>({
    mutationFn: (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<GenerateGoalResult>(
          '/api/tools/goal-generator/generate',
          serializeGoalParams(params),
        );
      }
      return generateGoals(params);
    },
  });
}

export function useRefineGoal() {
  return useMutation<RefineGoalResult, Error, RefineGoalParams>({
    mutationFn: (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<RefineGoalResult>(
          '/api/tools/goal-generator/refine',
          serializeGoalParams(params),
        );
      }
      return refineGoal(params);
    },
  });
}
