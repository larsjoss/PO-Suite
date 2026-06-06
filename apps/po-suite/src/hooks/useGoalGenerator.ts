import { useMutation } from '@tanstack/react-query';
import { generateGoals, refineGoal } from '../services/goalGenerator';
import { fetchApi } from '../shared/services/httpClient';
import { useTeamContext } from '../shared/hooks/useTeamContext';
import { useWorkspace } from '../shared/context/WorkspaceContext';
import type {
  GenerateGoalParams,
  GenerateGoalResult,
  RefineGoalParams,
  RefineGoalResult,
} from '../types';
import { IS_ENTERPRISE } from '../shared/config/env';

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
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation<GenerateGoalResult, Error, GenerateGoalParams>({
    mutationFn: (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<GenerateGoalResult>(
          '/api/tools/goal-generator/generate',
          serializeGoalParams(params),
        );
      }
      return generateGoals(params, teamContext, activeWorkspace?.workspaceContext ?? '');
    },
  });
}

export function useRefineGoal() {
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation<RefineGoalResult, Error, RefineGoalParams>({
    mutationFn: (params) => {
      if (IS_ENTERPRISE) {
        return fetchApi<RefineGoalResult>(
          '/api/tools/goal-generator/refine',
          serializeGoalParams(params),
        );
      }
      return refineGoal(params, teamContext, activeWorkspace?.workspaceContext ?? '');
    },
  });
}
