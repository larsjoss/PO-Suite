import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useGenerateStory } from '../../hooks/useStory';
import { Button, TextArea, InlineError, PanelHeader } from '../../shared/components';
import { WorkspaceArtifactPanel } from '../workspace/WorkspaceArtifactPanel';

interface Props {
  onGeneratingChange?: (generating: boolean) => void;
}

export function StoryInputPanel({ onGeneratingChange }: Props) {
  const [rawInput, setRawInput] = useState('');
  const generateStory = useGenerateStory();
  const isGenerating = generateStory.isPending;
  const generateError = generateStory.error;

  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;
    generateStory.mutate(rawInput.trim(), {
      onSuccess: () => setRawInput(''),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Anforderung" id="anforderung-heading" />

      <form onSubmit={handleGenerate} className="flex flex-col flex-1 overflow-hidden">
        <section aria-labelledby="anforderung-heading" className="flex flex-col flex-1 overflow-hidden p-5">
          <WorkspaceArtifactPanel onAppend={(c) => setRawInput((prev) => prev + c)} />
          <TextArea
            id="anforderung-input"
            label="Anforderung beschreiben"
            hideLabel
            value={rawInput}
            onChange={setRawInput}
            placeholder="Anforderung in eigenen Worten beschreiben."
            rows={4}
            disabled={isGenerating}
            className="flex-1 [&>textarea]:flex-1 [&>textarea]:h-auto"
          />
        </section>

        <div className="px-4 py-3.5 border-t border-edge shrink-0 space-y-2">
          {generateError && (
            <InlineError
              message={
                generateError instanceof Error
                  ? generateError.message
                  : 'Fehler beim Generieren.'
              }
            />
          )}

          <Button
            type="submit"
            disabled={!rawInput.trim()}
            loading={isGenerating}
            className="w-full"
          >
            {!isGenerating && (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            )}
            {isGenerating ? 'Wird generiert…' : 'Story generieren'}
          </Button>
        </div>
      </form>
    </div>
  );
}
