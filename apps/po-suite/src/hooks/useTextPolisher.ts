import { useMutation } from '@tanstack/react-query';
import { polishText } from '../services/textPolisher';
import { fetchApi } from '../shared/services/httpClient';
import { useTeamContext } from '../shared/hooks/useTeamContext';
import { useWorkspace } from '../shared/context/WorkspaceContext';
import type { UseCase, Tone } from '../types';
import { IS_ENTERPRISE } from '../shared/config/env';

export function usePolishText() {
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({
      input,
      useCase,
      tone,
    }: {
      input: string;
      useCase: UseCase;
      tone: Tone;
    }) => {
      if (IS_ENTERPRISE) {
        const res = await fetchApi<{ result: string }>('/api/tools/text-polisher/polish', {
          input,
          useCase,
          tone,
        });
        return res.result;
      }
      return polishText(input, useCase, tone, teamContext, activeWorkspace?.workspaceContext ?? '');
    },
  });
}
