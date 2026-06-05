import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { DocMode, StoryDocInput, FeatureDocInput, UploadedFile } from '../types';
import { useGenerateDoc } from '../hooks/useDocGenerator';
import { DocGeneratorInputPanel } from '../components/doc-generator/DocGeneratorInputPanel';
import { DocGeneratorOutputPanel } from '../components/doc-generator/DocGeneratorOutputPanel';
import { ConfirmDialog, HandoffBanner } from '../shared/components';
import { getHandoff, clearHandoff } from '../shared/services/handoffService';

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
  decisions: '',
};

function hasStoryInput(input: StoryDocInput): boolean {
  return !!(input.title.trim() || input.description.trim() || input.confluenceSpec.trim() || input.code.trim());
}

function hasFeatureInput(input: FeatureDocInput): boolean {
  return !!(input.title.trim() || input.description.trim() || input.stories.trim() || input.confluenceSpec.trim() || input.code.trim());
}

type PendingConfirm = { title: string; message: string; onConfirm: () => void } | null;

export function DocGeneratorPage() {
  const [mode, setMode] = useState<DocMode>('story');
  const [screen, setScreen] = useState<'input' | 'output'>('input');
  const [storyInput, setStoryInput] = useState<StoryDocInput>(EMPTY_STORY);
  const [featureInput, setFeatureInput] = useState<FeatureDocInput>(EMPTY_FEATURE);
  const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [handoffSource, setHandoffSource] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);
  const mutation = useGenerateDoc();

  useEffect(() => {
    if (screen === 'output') outputRef.current?.focus();
  }, [screen]);

  // Handoff beim Mount lesen
  useEffect(() => {
    const handoff = getHandoff();
    if (!handoff) return;
    if (handoff.source === 'story') {
      setMode('story');
      setStoryInput((prev) => ({
        ...prev,
        description: handoff.content,
        ...(handoff.title ? { title: handoff.title } : {}),
      }));
      setHandoffSource('Story Generator');
    } else if (handoff.source === 'testcase') {
      setMode('story');
      setStoryInput((prev) => ({
        ...prev,
        confluenceSpec: handoff.content,
        ...(handoff.title ? { title: handoff.title } : {}),
      }));
      setHandoffSource('Test Case Generator');
    }
    clearHandoff();
  }, []);

  const dismissConfirm = useCallback(() => setConfirm(null), []);

  function handleModeChange(newMode: DocMode) {
    if (newMode === mode) return;
    const hasInput =
      mode === 'story' ? hasStoryInput(storyInput) : hasFeatureInput(featureInput);
    if (hasInput) {
      setConfirm({
        title: 'Modus wechseln',
        message: 'Beim Wechsel des Modus gehen die Eingaben verloren. Fortfahren?',
        onConfirm: () => {
          setMode(newMode);
          setStoryInput(EMPTY_STORY);
          setFeatureInput(EMPTY_FEATURE);
          setScreenshots([]);
          mutation.reset();
          setConfirm(null);
        },
      });
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
    setConfirm({
      title: 'Zurücksetzen',
      message: 'Formular und Output zurücksetzen?',
      onConfirm: () => {
        setScreen('input');
        setStoryInput(EMPTY_STORY);
        setFeatureInput(EMPTY_FEATURE);
        setScreenshots([]);
        mutation.reset();
        setConfirm(null);
      },
    });
  }

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-canvas">
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={confirm?.onConfirm ?? dismissConfirm}
        onCancel={dismissConfirm}
      />
      {screen === 'input' ? (
        <div className="max-w-3xl mx-auto px-6 py-8">
          {handoffSource && (
            <HandoffBanner source={handoffSource} onDismiss={() => setHandoffSource(null)} />
          )}
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
