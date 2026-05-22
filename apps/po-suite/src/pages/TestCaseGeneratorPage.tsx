import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadedFile } from '../types';
import { useGenerateTestCases } from '../hooks/useTestCaseGenerator';
import { useTestCasePlan } from '../hooks/useTestCasePlans';
import { TestCaseInputPanel } from '../components/test-case-generator/TestCaseInputPanel';
import { TestCaseOutputPanel } from '../components/test-case-generator/TestCaseOutputPanel';
import { TestCasePlanSidebar } from '../components/test-case-generator/TestCasePlanSidebar';

const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise';

type TabId = 'verlauf' | 'inhalt';

export function TestCaseGeneratorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [storyText, setStoryText] = useState('');
  const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);
  const [testContext, setTestContext] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>(id ? 'inhalt' : 'verlauf');

  const outputRef = useRef<HTMLDivElement>(null);
  const mutation = useGenerateTestCases();

  const { data: loadedPlan, isLoading: isPlanLoading } = useTestCasePlan(id);

  const displayPlan = id ? loadedPlan : (mutation.data ?? undefined);
  const showOutput = !!displayPlan;
  const isLoading = mutation.isPending || (!!id && isPlanLoading);

  // Fokus auf Output nach Transition (WCAG 2.4.3)
  useEffect(() => {
    if (showOutput && !isLoading) outputRef.current?.focus();
  }, [showOutput, isLoading, id]);

  // Bei neuer ID aus URL → Tab auf Inhalt wechseln (mobile)
  useEffect(() => {
    if (id) setActiveTab('inhalt');
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storyText.trim()) return;
    try {
      await mutation.mutateAsync({
        storyText: storyText.trim(),
        testContext: testContext.trim() || undefined,
        screenshots: screenshots.map((f) => ({
          base64: f.base64,
          mediaType: f.file.type as 'image/png' | 'image/jpeg' | 'image/webp',
        })),
      });
      // Navigation zu /:id erfolgt in useGenerateTestCases onSuccess (non-enterprise)
      if (IS_ENTERPRISE) setActiveTab('inhalt');
    } catch {
      // Fehler in mutation.error — im InputPanel als InlineError angezeigt
    }
  }

  function handleReset() {
    mutation.reset();
    navigate('/tools/test-case-generator');
    setStoryText('');
    setScreenshots([]);
    setTestContext('');
  }

  const mainContent = showOutput && displayPlan ? (
    <TestCaseOutputPanel
      testPlan={displayPlan}
      onReset={handleReset}
      contentRef={outputRef}
    />
  ) : (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <TestCaseInputPanel
        storyText={storyText}
        screenshots={screenshots}
        testContext={testContext}
        isLoading={mutation.isPending}
        error={mutation.error}
        onStoryChange={setStoryText}
        onScreenshotsChange={setScreenshots}
        onTestContextChange={setTestContext}
        onSubmit={handleSubmit}
      />
    </div>
  );

  // Enterprise: kein Sidebar, volles Layout wie vorher
  if (IS_ENTERPRISE) {
    return (
      <main id="main-content" className="flex-1 overflow-auto bg-canvas">
        {mainContent}
      </main>
    );
  }

  return (
    <div id="main-content" className="flex flex-col flex-1 overflow-hidden">
      {/* Desktop: Sidebar + Hauptinhalt nebeneinander */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0 border-r border-edge bg-surface overflow-hidden flex flex-col">
          <TestCasePlanSidebar />
        </div>
        <main className="flex-1 overflow-auto bg-canvas">
          {mainContent}
        </main>
      </div>

      {/* Mobile: Tab-Navigation */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <div
          role="tablist"
          aria-label="Testplan-Bereiche"
          className="flex shrink-0 border-b border-edge bg-surface"
        >
          {(['verlauf', 'inhalt'] as TabId[]).map((tab, idx) => (
            <button
              key={tab}
              role="tab"
              id={`tcg-tab-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`tcg-panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setActiveTab(idx === 0 ? 'inhalt' : 'verlauf');
                }
              }}
              className={[
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                activeTab === tab
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-secondary hover:text-ink hover:border-edge',
              ].join(' ')}
            >
              {tab === 'verlauf' ? 'Verlauf' : 'Generieren'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden bg-canvas">
          <div
            role="tabpanel"
            id="tcg-panel-verlauf"
            aria-labelledby="tcg-tab-verlauf"
            hidden={activeTab !== 'verlauf'}
            className="h-full"
          >
            <TestCasePlanSidebar />
          </div>
          <div
            role="tabpanel"
            id="tcg-panel-inhalt"
            aria-labelledby="tcg-tab-inhalt"
            hidden={activeTab !== 'inhalt'}
            className="h-full overflow-auto"
          >
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );
}
