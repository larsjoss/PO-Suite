import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type {
  GoalMode,
  GoalVariant,
  SprintGoalInput,
  PiObjectiveInput,
  UploadedFile,
} from '../types';
import { useGenerateGoals, useRefineGoal } from '../hooks/useGoalGenerator';
import { GoalTabSelector } from '../components/goal-generator/GoalTabSelector';
import { SprintGoalInputPanel } from '../components/goal-generator/SprintGoalInputPanel';
import { PiObjectiveInputPanel } from '../components/goal-generator/PiObjectiveInputPanel';
import { GoalGeneratorOutputPanel } from '../components/goal-generator/GoalGeneratorOutputPanel';

const EMPTY_SPRINT: SprintGoalInput = { idea: '' };
const EMPTY_PI: PiObjectiveInput = {
  featureTitle: '',
  featureDescription: '',
  jiraReference: '',
  acceptedBy: '',
  acceptanceDate: '',
  acceptanceLevel: '',
};

export function GoalGeneratorPage() {
  // ── Form-State ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<GoalMode>('sprint-goal');
  const [screen, setScreen] = useState<'input' | 'output'>('input');
  const [sprintInput, setSprintInput] = useState<SprintGoalInput>(EMPTY_SPRINT);
  const [screenshot, setScreenshot] = useState<UploadedFile | null>(null);
  const [piInput, setPiInput] = useState<PiObjectiveInput>(EMPTY_PI);

  // ── Generation-State ──────────────────────────────────────────────────────
  const [variants, setVariants] = useState<GoalVariant[]>([]);
  const [rawInitialResponse, setRawInitialResponse] = useState('');

  // ── Refinement-State ──────────────────────────────────────────────────────
  const [outputView, setOutputView] = useState<'variants' | 'refining'>('variants');
  const [selectedVariant, setSelectedVariant] = useState<GoalVariant | null>(null);
  const [refinedVariant, setRefinedVariant] = useState<GoalVariant | null>(null);
  const [refinementHint, setRefinementHint] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<
    Array<{ userMessage: string; rawResult: string }>
  >([]);

  const outputRef = useRef<HTMLDivElement>(null);
  const generateMutation = useGenerateGoals();
  const refineMutation = useRefineGoal();

  // WCAG 2.4.3: Fokus auf Output-Bereich nach Screen-Transition
  useEffect(() => {
    if (screen === 'output') outputRef.current?.focus();
  }, [screen]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function hasContent(): boolean {
    if (tab === 'sprint-goal') return !!(sprintInput.idea.trim() || screenshot);
    return !!(piInput.featureTitle.trim() || piInput.featureDescription.trim());
  }

  function resetRefinementState() {
    setOutputView('variants');
    setSelectedVariant(null);
    setRefinedVariant(null);
    setRefinementHint('');
    setRefinementHistory([]);
    refineMutation.reset();
  }

  // ── Tab-Wechsel ───────────────────────────────────────────────────────────

  function handleTabChange(newTab: GoalMode) {
    if (newTab === tab) return;
    const hasAny = hasContent() || screen === 'output';
    if (hasAny && !window.confirm('Beim Wechsel des Tabs gehen Eingaben und Output verloren. Fortfahren?')) {
      return;
    }
    setTab(newTab);
    setScreen('input');
    setSprintInput(EMPTY_SPRINT);
    setScreenshot(null);
    setPiInput(EMPTY_PI);
    setVariants([]);
    setRawInitialResponse('');
    resetRefinementState();
    generateMutation.reset();
  }

  // ── Generierung ───────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await generateMutation.mutateAsync(
        tab === 'sprint-goal'
          ? { mode: 'sprint-goal', input: sprintInput, screenshot }
          : { mode: 'pi-objective', input: piInput },
      );
      setVariants(result.variants);
      setRawInitialResponse(result.rawText);
      resetRefinementState();
      setScreen('output');
    } catch {
      // Fehler in generateMutation.error → InlineError im InputPanel
    }
  }

  async function handleRegenerate() {
    try {
      const result = await generateMutation.mutateAsync(
        tab === 'sprint-goal'
          ? { mode: 'sprint-goal', input: sprintInput, screenshot }
          : { mode: 'pi-objective', input: piInput },
      );
      setVariants(result.variants);
      setRawInitialResponse(result.rawText);
      resetRefinementState();
    } catch {
      // Fehler in generateMutation.error → InlineError im OutputPanel
    }
  }

  function handleReset() {
    if (!window.confirm('Formular und Output zurücksetzen?')) return;
    setScreen('input');
    setSprintInput(EMPTY_SPRINT);
    setScreenshot(null);
    setPiInput(EMPTY_PI);
    setVariants([]);
    setRawInitialResponse('');
    resetRefinementState();
    generateMutation.reset();
  }

  // ── Refinement ────────────────────────────────────────────────────────────

  function handleSelectForRefine(variant: GoalVariant) {
    setSelectedVariant(variant);
    setRefinedVariant(null);
    setRefinementHint('');
    setRefinementHistory([]);
    setOutputView('refining');
    refineMutation.reset();
  }

  function handleBackToVariants() {
    setOutputView('variants');
  }

  async function handleRefineSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedVariant || !refinementHint.trim()) return;

    // Zweite Iteration: bereits verfeinerte Variante als neuer Ausgangspunkt
    const variantToRefine = refinedVariant ?? selectedVariant;

    try {
      const result = await refineMutation.mutateAsync(
        tab === 'sprint-goal'
          ? { mode: 'sprint-goal', input: sprintInput, screenshot, rawInitialResponse, selectedVariantText: variantToRefine.text, refinementHint, previousRefinements: refinementHistory }
          : { mode: 'pi-objective', input: piInput, rawInitialResponse, selectedVariantText: variantToRefine.text, refinementHint, previousRefinements: refinementHistory },
      );
      setRefinementHistory((prev) => [
        ...prev,
        { userMessage: result.userMessage, rawResult: result.rawText },
      ]);
      setRefinedVariant(result.variant);
      setRefinementHint('');
    } catch {
      // Fehler in refineMutation.error → InlineError im OutputPanel
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (screen === 'output') {
    return (
      <main id="main-content" className="flex-1 overflow-auto bg-canvas">
        <GoalGeneratorOutputPanel
          mode={tab}
          variants={variants}
          isGenerating={generateMutation.isPending}
          generateError={generateMutation.error}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          onSelectForRefine={handleSelectForRefine}
          outputView={outputView}
          selectedVariant={selectedVariant}
          refinedVariant={refinedVariant}
          refinementHint={refinementHint}
          isRefining={refineMutation.isPending}
          refineError={refineMutation.error}
          onRefinementHintChange={setRefinementHint}
          onRefineSubmit={handleRefineSubmit}
          onBackToVariants={handleBackToVariants}
          contentRef={outputRef}
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-canvas">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Goal Generator</h1>
          <p className="text-sm text-ink-secondary">
            Outcome-orientierte Sprint Goals und PI Objectives formulieren.
          </p>
        </div>

        <GoalTabSelector
          value={tab}
          onChange={handleTabChange}
          disabled={generateMutation.isPending}
        />

        {tab === 'sprint-goal' ? (
          <SprintGoalInputPanel
            input={sprintInput}
            screenshot={screenshot}
            isLoading={generateMutation.isPending}
            error={generateMutation.error}
            onChange={(patch) => setSprintInput((prev) => ({ ...prev, ...patch }))}
            onScreenshotChange={setScreenshot}
            onSubmit={handleSubmit}
          />
        ) : (
          <PiObjectiveInputPanel
            input={piInput}
            isLoading={generateMutation.isPending}
            error={generateMutation.error}
            onChange={(patch) => setPiInput((prev) => ({ ...prev, ...patch }))}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </main>
  );
}
