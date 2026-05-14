import type { FormEvent } from 'react';
import type { SprintGoalInput, UploadedFile } from '../../types';
import { Button, TextArea, InlineError, ScreenshotUpload } from '../../shared/components';

interface Props {
  input: SprintGoalInput;
  screenshot: UploadedFile | null;
  isLoading: boolean;
  error: Error | null;
  onChange: (patch: Partial<SprintGoalInput>) => void;
  onScreenshotChange: (file: UploadedFile | null) => void;
  onSubmit: (e: FormEvent) => void;
}

export function SprintGoalInputPanel({
  input,
  screenshot,
  isLoading,
  error,
  onChange,
  onScreenshotChange,
  onSubmit,
}: Props) {
  const submitDisabled = !input.idea.trim();

  return (
    <form
      id="gg-panel-sprint-goal"
      role="tabpanel"
      aria-labelledby="gg-tab-sprint-goal"
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
    >
      <div>
        <TextArea
          id="gg-sprint-idea"
          label="Sprint Goal Idee"
          value={input.idea}
          onChange={(val) => onChange({ idea: val })}
          placeholder="Welches Problem wird in diesem Sprint gelöst? Was kann der User am Ende, was vorher nicht möglich war?"
          rows={5}
          autoGrow
          disabled={isLoading}
        />
        <p className="mt-1.5 text-xs text-ink-tertiary leading-relaxed">
          Tipp: Beschreibe welches Problem in diesem Sprint gelöst wird und was der User am Ende des
          Sprints tun kann, was vorher nicht möglich war. Je konkreter der Input, desto schärfer der
          Output.
        </p>
      </div>

      <ScreenshotUpload
        files={screenshot ? [screenshot] : []}
        onChange={(files) => onScreenshotChange(files[0] ?? null)}
        disabled={isLoading}
        maxFiles={1}
      />

      {error && (
        <InlineError
          message={error instanceof Error ? error.message : 'Fehler bei der Generierung. Bitte erneut versuchen.'}
        />
      )}

      <Button
        type="submit"
        disabled={submitDisabled}
        loading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Vorschläge werden generiert…' : 'Varianten generieren'}
      </Button>

      <p aria-live="polite" className="sr-only">
        {isLoading ? 'Vorschläge werden generiert, bitte warten.' : ''}
      </p>
    </form>
  );
}
