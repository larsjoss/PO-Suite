import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { DocMode, StoryDocInput, FeatureDocInput, UploadedFile } from '../types';
import { useGenerateDoc } from '../hooks/useDocGenerator';
import { DocGeneratorInputPanel } from '../components/doc-generator/DocGeneratorInputPanel';
import { DocGeneratorOutputPanel } from '../components/doc-generator/DocGeneratorOutputPanel';

const EMPTY_STORY: StoryDocInput = {
  title: '',
  description: '',
  confluenceSpec: '',
  code: '',
  acceptedBy: '',
  deploymentDate: '',
};

const EMPTY_FEATURE: FeatureDocInput = {
  title: '',
  description: '',
  stories: '',
  confluenceSpec: '',
  code: '',
  responsible: '',
  deploymentDate: '',
};

function hasStoryInput(input: StoryDocInput): boolean {
  return !!(input.title.trim() || input.description.trim() || input.confluenceSpec.trim() || input.code.trim());
}

function hasFeatureInput(input: FeatureDocInput): boolean {
  return !!(input.title.trim() || input.description.trim() || input.stories.trim() || input.confluenceSpec.trim() || input.code.trim());
}

export function DocGeneratorPage() {
  const [mode, setMode] = useState<DocMode>('story');
  const [screen, setScreen] = useState<'input' | 'output'>('input');
  const [storyInput, setStoryInput] = useState<StoryDocInput>(EMPTY_STORY);
  const [featureInput, setFeatureInput] = useState<FeatureDocInput>(EMPTY_FEATURE);
  const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);

  const outputRef = useRef<HTMLDivElement>(null);
  const mutation = useGenerateDoc();

  // Programmatischer Fokus auf Output nach Screen-Transition (WCAG 2.4.3)
  useEffect(() => {
    if (screen === 'output') outputRef.current?.focus();
  }, [screen]);

  function handleModeChange(newMode: DocMode) {
    if (newMode === mode) return;
    const hasInput =
      mode === 'story' ? hasStoryInput(storyInput) : hasFeatureInput(featureInput);
    if (hasInput && !window.confirm('Beim Wechsel des Modus gehen die Eingaben verloren. Fortfahren?')) {
      return;
    }
    setMode(newMode);
    setStoryInput(EMPTY_STORY);
    setFeatureInput(EMPTY_FEATURE);
    setScreenshots([]);
    mutation.reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await mutation.mutateAsync(
        mode === 'story'
          ? { mode: 'story', input: storyInput, screenshots }
          : { mode: 'feature', input: featureInput, screenshots },
      );
      setScreen('output');
    } catch {
      // Fehler liegt in mutation.error — wird im InputPanel als InlineError angezeigt
    }
  }

  async function handleRegenerate() {
    try {
      await mutation.mutateAsync(
        mode === 'story'
          ? { mode: 'story', input: storyInput, screenshots }
          : { mode: 'feature', input: featureInput, screenshots },
      );
    } catch {
      // Fehler liegt in mutation.error — wird im OutputPanel als nächste Interaction sichtbar
    }
  }

  function handleReset() {
    if (!window.confirm('Formular und Output zurücksetzen?')) return;
    setScreen('input');
    setStoryInput(EMPTY_STORY);
    setFeatureInput(EMPTY_FEATURE);
    setScreenshots([]);
    mutation.reset();
  }

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-canvas">
      {screen === 'input' ? (
        <div className="max-w-3xl mx-auto px-6 py-8">
          <DocGeneratorInputPanel
            mode={mode}
            storyInput={storyInput}
            featureInput={featureInput}
            screenshots={screenshots}
            isLoading={mutation.isPending}
            error={mutation.error}
            onModeChange={handleModeChange}
            onStoryChange={(patch) => setStoryInput((prev) => ({ ...prev, ...patch }))}
            onFeatureChange={(patch) => setFeatureInput((prev) => ({ ...prev, ...patch }))}
            onScreenshotsChange={setScreenshots}
            onSubmit={handleSubmit}
          />
        </div>
      ) : mutation.data ? (
        <DocGeneratorOutputPanel
          markdown={mutation.data}
          isLoading={mutation.isPending}
          error={mutation.error}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          contentRef={outputRef}
        />
      ) : null}
    </main>
  );
}
