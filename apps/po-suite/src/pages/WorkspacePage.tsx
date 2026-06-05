import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { StoryInputPanel } from '../components/story-generator/StoryInputPanel';
import { StoryOutputPanel } from '../components/story-generator/StoryOutputPanel';
import { InsightsPanel } from '../components/story-generator/InsightsPanel';
import { useStory } from '../hooks/useStory';
import { CoachPanel } from '../shared/components';
import { useCoachVisibility } from '../shared/hooks/useCoachVisibility';
import { STORY_COACH_CONFIG } from '../shared/config/coachConfig';

type TabId = 'verlauf' | 'anforderung' | 'story';

const TAB_LABELS: Record<TabId, string> = {
  verlauf: 'Verlauf',
  anforderung: 'Anforderung',
  story: 'Story',
};

const TABS: TabId[] = ['verlauf', 'anforderung', 'story'];

export function WorkspacePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useStory(id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const story = data?.story;
  const { isVisible: coachVisible, showCoach, dismiss: dismissCoach, dismissForever } = useCoachVisibility();
  const [toggledSteps, setToggledSteps] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>('anforderung');

  useEffect(() => {
    if (story && !isGenerating) showCoach();
  }, [story, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveTab(id ? 'story' : 'anforderung');
  }, [id]);

  const inputContent = (
    <div className="flex flex-col h-full">
      <StoryInputPanel onGeneratingChange={setIsGenerating} />
    </div>
  );

  const outputContent = (
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
          onStepToggle={(stepId) =>
            setToggledSteps((prev) => {
              const next = new Set(prev);
              if (next.has(stepId)) next.delete(stepId); else next.add(stepId);
              return next;
            })
          }
          toggledSteps={toggledSteps}
        />
      ) : undefined}
    />
  );

  const insightsContent = (
    <InsightsPanel
      story={story}
      isLoading={isLoading && !!id}
      onRefiningChange={setIsRefining}
    />
  );

  return (
    <div id="main-content" className="flex flex-col flex-1 overflow-hidden">
      {/* Desktop: Sidebar + Hauptinhalt nebeneinander */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 border-r border-edge bg-surface overflow-hidden flex flex-col">
          <Sidebar />
        </div>
        {!id ? (
          <main className="flex-1 overflow-hidden bg-canvas">
            {inputContent}
          </main>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto bg-canvas">
              {outputContent}
            </main>
            <div className="w-96 shrink-0 border-l border-edge bg-surface overflow-hidden flex flex-col">
              {insightsContent}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Tab-Navigation */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div
          role="tablist"
          aria-label="Story-Bereiche"
          className="flex shrink-0 border-b border-edge bg-surface"
        >
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              role="tab"
              id={`sg-tab-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`sg-panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const dir = e.key === 'ArrowRight' ? 1 : -1;
                  setActiveTab(TABS[(idx + dir + TABS.length) % TABS.length]);
                }
              }}
              className={[
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                activeTab === tab
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-secondary hover:text-ink hover:border-edge',
              ].join(' ')}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden bg-canvas">
          <div
            role="tabpanel"
            id="sg-panel-verlauf"
            aria-labelledby="sg-tab-verlauf"
            hidden={activeTab !== 'verlauf'}
            className="h-full"
          >
            <Sidebar />
          </div>
          <div
            role="tabpanel"
            id="sg-panel-anforderung"
            aria-labelledby="sg-tab-anforderung"
            hidden={activeTab !== 'anforderung'}
            className="h-full"
          >
            {inputContent}
          </div>
          <div
            role="tabpanel"
            id="sg-panel-story"
            aria-labelledby="sg-tab-story"
            hidden={activeTab !== 'story'}
            className="h-full overflow-auto"
          >
            {outputContent}
            {insightsContent}
          </div>
        </div>
      </div>
    </div>
  );
}
