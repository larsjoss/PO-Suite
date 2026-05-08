import { useMutation } from '@tanstack/react-query';
import { polishText } from '../services/textPolisher';
import type { UseCase, Tone } from '../services/textPolisher';

export type { UseCase, Tone };

export function usePolishText() {
  return useMutation({
    mutationFn: ({
      input,
      useCase,
      tone,
    }: {
      input: string;
      useCase: UseCase;
      tone: Tone;
    }) => polishText(input, useCase, tone),
  });
}
