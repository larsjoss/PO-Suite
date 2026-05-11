import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as storage from '../services/storage';
import { fetchApiGet, fetchApiDelete } from '../shared/services/httpClient';
import type { StoriesResponse } from '../types';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

export function useStories(q: string) {
  return useQuery({
    queryKey: ['stories', q],
    queryFn: () => {
      if (IS_ENTERPRISE) {
        const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : '';
        return fetchApiGet<StoriesResponse>(`/api/stories${qs}`);
      }
      return storage.getStories(q);
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (IS_ENTERPRISE) {
        await fetchApiDelete(`/api/stories/${id}`);
        return;
      }
      storage.deleteStory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
