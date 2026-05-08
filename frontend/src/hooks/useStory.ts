import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as storage from '../services/storage';
import * as claude from '../services/claude';
import type { StoryDetailResponse } from '../types';

export function useStory(id: string | undefined) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => storage.getStory(id!),
    enabled: !!id,
  });
}

export function useGenerateStory() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (rawInput: string) => {
      const { generatedStory, refinementHints } = await claude.generateStory(rawInput);
      const title = claude.extractTitle(generatedStory, rawInput);
      return storage.createStory(title, rawInput, generatedStory, refinementHints);
    },
    onSuccess: (story) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      navigate(`/tools/story-generator/${story.id}`);
    },
  });
}

export function useRefineStoryWithHints(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      currentStory: string;
      hintAnswers: claude.HintAnswer[];
      currentTitle: string;
    }) => {
      const { generatedStory, refinementHints } = await claude.refineStoryWithHints(
        params.currentStory,
        params.hintAnswers,
      );
      const title = claude.extractTitle(generatedStory, params.currentTitle);
      return storage.updateStory(id, generatedStory, refinementHints, title);
    },
    onSuccess: (story) => {
      queryClient.setQueryData(['story', id], (old: StoryDetailResponse | undefined) => {
        if (!old) return old;
        return { ...old, story };
      });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useRefineStory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instruction: string) => {
      const { story, refinements } = storage.getStory(id);
      const conversationHistory: claude.ConversationMessage[] = [
        { role: 'user', content: story.rawInput },
        {
          role: 'assistant',
          content:
            story.generatedStory +
            (story.refinementHints ? '\n\n**Refinement Hinweise**\n' + story.refinementHints : ''),
        },
        ...refinements.flatMap((r) => [
          { role: 'user' as const, content: r.instruction },
          { role: 'assistant' as const, content: r.resultStory },
        ]),
        { role: 'user', content: instruction },
      ];

      const { generatedStory, refinementHints } = await claude.refineStory(conversationHistory);
      const title = claude.extractTitle(generatedStory, story.rawInput);
      storage.addRefinement(id, instruction, generatedStory);
      return storage.updateStory(id, generatedStory, refinementHints, title);
    },
    onSuccess: (story) => {
      queryClient.setQueryData(['story', id], (old: StoryDetailResponse | undefined) => {
        if (!old) return old;
        return { ...old, story };
      });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
