import { useMutation } from '@tanstack/react-query';
import { generateDoc } from '../services/docGenerator';
import type { GenerateDocParams } from '../types';

export function useGenerateDoc() {
  return useMutation<string, Error, GenerateDocParams>({
    mutationFn: generateDoc,
  });
}
