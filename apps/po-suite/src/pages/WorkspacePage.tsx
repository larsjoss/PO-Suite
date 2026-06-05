import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StoryInputPanel } from '../components/story-generator/StoryInputPanel';
import { StoryOutputPanel } from '../components/story-generator/StoryOutputPanel';
import { InsightsPanel } from '../components/story-generator/InsightsPanel';
import { useStory } from '../hooks/useStory';
import { CoachPanel } from '../shared/components';
import { useCoachVisibility } from '../shared/hooks/useCoachVisibility';
import { STORY_COACH_CONFIG } from '../shared/config/coachConfig';

export function WorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useStory(id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const story = data?.story;
  const { isVisible: coachVisible, showCoach, dismiss: dismissCoach, dismissForever } = useCoachVisibility();
  const [toggledSteps, setToggledSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (story && !isGenerating) showCoach();
  }, [story, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell
      leftPanel={<StoryInputPanel onGeneratingChange={setIsGenerating} />}
      centerPanel={
        <StoryOutputPanel
          story={story}
          isLoading={isLoading && !!id}
          isGenerating={isGenerating}
          isRefining={isRefining}
          coachSlot={coachVisible ? (
            <CoachPanel
              config={STORY_COACH_CONFIG}
              onDismiss={dismissCoach}
              onDismissForever={dismissForever}
              onNavigate={navigate}
              onStepToggle={(id) =>
                setToggledSteps((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })
              }
              toggledSteps={toggledSteps}
            />
          ) : undefined}
        />
      }
      rightPanel={
        <InsightsPanel
          story={story}
          isLoading={isLoading && !!id}
          onRefiningChange={setIsRefining}
        />
      }
    />
  );
}
