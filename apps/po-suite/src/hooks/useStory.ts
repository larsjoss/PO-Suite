import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as storage from '../services/storage';
import * as claude from '../services/claude';
import { fetchApi, fetchApiGet } from '../shared/services/httpClient';
import { useTeamContext } from '../shared/hooks/useTeamContext';
import { useWorkspace } from '../shared/context/WorkspaceContext';
import type { Story, StoryDetailResponse } from '../types';
import { IS_ENTERPRISE } from '../shared/config/env';

export function useStory(id: string | undefined) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => {
      if (IS_ENTERPRISE) {
        return fetchApiGet<StoryDetailResponse>(`/api/stories/${id!}`);
      }
      return storage.getStory(id!);
    },
    enabled: !!id,
  });
}

export function useGenerateStory() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();
  const workspaceContext = activeWorkspace?.workspaceContext ?? '';

  return useMutation({
    mutationFn: async (rawInput: string) => {
      if (IS_ENTERPRISE) {
        // Backend generates + persists atomically — returns full Story object
        return fetchApi<Story>('/api/tools/story/generate', { rawInput });
      }
      const { generatedStory, refinementHints } = await claude.generateStory(rawInput, teamContext, workspaceContext);
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
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (params: {
      currentStory: string;
      hintAnswers: claude.HintAnswer[];
      currentTitle: string;
    }) => {
      if (IS_ENTERPRISE) {
        const cached = queryClient.getQueryData<StoryDetailResponse>(['story', id]);
        return fetchApi<Story>('/api/tools/story/refine-hints', {
          currentStory: params.currentStory,
          hintAnswers: params.hintAnswers,
          storyId: cached?.story.id ?? id,
        });
      }
      const { generatedStory, refinementHints } = await claude.refineStoryWithHints(
        params.currentStory,
        params.hintAnswers,
        teamContext,
        activeWorkspace?.workspaceContext ?? '',
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
  const { teamContext } = useTeamContext();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (instruction: string) => {
      if (IS_ENTERPRISE) {
        const cached = queryClient.getQueryData<StoryDetailResponse>(['story', id]);
        const story = cached?.story;
        const refinements = cached?.refinements ?? [];

        const conversationHistory: claude.ConversationMessage[] = story
          ? [
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
            ]
          : [{ role: 'user', content: instruction }];

        return fetchApi<Story>('/api/tools/story/refine', {
          conversationHistory,
          storyId: id,
          instruction,
        });
      }

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

      const { generatedStory, refinementHints } = await claude.refineStory(
        conversationHistory,
        teamContext,
        activeWorkspace?.workspaceContext ?? '',
      );
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
