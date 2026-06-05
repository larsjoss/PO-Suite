import { useMutation } from '@tanstack/react-query';
import { generateDoc } from '../services/docGenerator';
import { fetchApi } from '../shared/services/httpClient';
import { useTeamContext } from '../shared/hooks/useTeamContext';
import { useWorkspace } from '../shared/context/WorkspaceContext';
import type { GenerateDocParams } from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

export function useGenerateDoc() {
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation<string, Error, GenerateDocParams>({
    mutationFn: async (params) => {
      if (IS_ENTERPRISE) {
        // Convert UploadedFile[] to plain ImageInput[] for the backend
        const screenshots = params.screenshots.map((uf) => ({
          base64: uf.base64,
          mediaType: uf.file.type as 'image/png' | 'image/jpeg' | 'image/webp',
        }));
        const res = await fetchApi<{ result: string }>('/api/tools/doc-generator/generate', {
          mode: params.mode,
          input: params.input,
          screenshots,
        });
        return res.result;
      }
      return generateDoc(params, teamContext, activeWorkspace?.workspaceContext ?? '');
    },
  });
}
