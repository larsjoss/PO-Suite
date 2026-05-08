import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as storage from '../services/storage';

export function useStories(q: string) {
  return useQuery({
    queryKey: ['stories', q],
    queryFn: () => storage.getStories(q),
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      storage.deleteStory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
