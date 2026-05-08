import { useState, FormEvent, useEffect } from 'react';
import { useGenerateStory } from '../../hooks/useStory';
import { Button, TextArea, InlineError, PanelHeader } from '../../shared/components';

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

      <div className="flex-1 overflow-y-auto p-5">
        <section aria-labelledby="anforderung-heading">
          <form onSubmit={handleGenerate} className="space-y-3">
            <TextArea
              id="anforderung-input"
              label="Anforderung beschreiben"
              value={rawInput}
              onChange={setRawInput}
              placeholder="Anforderung in eigenen Worten beschreiben."
              rows={8}
              disabled={isGenerating}
            />

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
              {isGenerating ? 'Wird generiert…' : 'Story generieren'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
