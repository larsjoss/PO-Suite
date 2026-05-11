import { useMutation } from '@tanstack/react-query';
import { polishText } from '../services/textPolisher';
import { fetchApi } from '../shared/services/httpClient';
import type { UseCase, Tone } from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

export function usePolishText() {
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
      return polishText(input, useCase, tone);
    },
  });
}
