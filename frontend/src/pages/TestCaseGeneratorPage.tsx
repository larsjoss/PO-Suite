import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { UploadedFile } from '../types';
import { useGenerateTestCases } from '../hooks/useTestCaseGenerator';
import { TestCaseInputPanel } from '../components/test-case-generator/TestCaseInputPanel';
import { TestCaseOutputPanel } from '../components/test-case-generator/TestCaseOutputPanel';

export function TestCaseGeneratorPage() {
  const [storyText, setStoryText] = useState('');
  const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);
  const [testContext, setTestContext] = useState('');
  const [screen, setScreen] = useState<'input' | 'output'>('input');

  const outputRef = useRef<HTMLDivElement>(null);
  const mutation = useGenerateTestCases();

  // Programmatischer Fokus auf Output-Bereich nach Screen-Transition (WCAG 2.4.3)
  useEffect(() => {
    if (screen === 'output') outputRef.current?.focus();
  }, [screen]);

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
      setScreen('output');
    } catch {
      // Fehler liegt in mutation.error — wird im InputPanel als InlineError angezeigt
    }
  }

  function handleReset() {
    setScreen('input');
    mutation.reset();
  }

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-canvas">
      {screen === 'input' ? (
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
      ) : mutation.data ? (
        <TestCaseOutputPanel
          testPlan={mutation.data}
          onReset={handleReset}
          contentRef={outputRef}
        />
      ) : null}
    </main>
  );
}
