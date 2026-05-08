import type { FormEvent } from 'react';
import type { UploadedFile } from '../../types';
import { Button, TextArea, InlineError, ScreenshotUpload } from '../../shared/components';

interface Props {
  storyText: string;
  screenshots: UploadedFile[];
  testContext: string;
  isLoading: boolean;
  error: Error | null;
  onStoryChange: (text: string) => void;
  onScreenshotsChange: (files: UploadedFile[]) => void;
  onTestContextChange: (text: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function TestCaseInputPanel({
  storyText,
  screenshots,
  testContext,
  isLoading,
  error,
  onStoryChange,
  onScreenshotsChange,
  onTestContextChange,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-1">
          Testplan generieren
        </h1>
        <p className="text-sm text-ink-secondary">
          User Story eingeben und optional Screenshots hochladen — der Rest passiert automatisch.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* Story-Textarea */}
        <TextArea
          id="tcg-story"
          label="User Story / Akzeptanzkriterien"
          value={storyText}
          onChange={onStoryChange}
          placeholder={`Titel: Als Nutzer möchte ich ...\n\nAusgangslage: ...\n\nAK-1: ...\nAK-2: ...\nAK-3: ...`}
          rows={10}
          autoGrow
          disabled={isLoading}
        />

        {/* Screenshot-Upload */}
        <ScreenshotUpload
          files={screenshots}
          onChange={onScreenshotsChange}
          disabled={isLoading}
          maxFiles={3}
        />

        {/*
         * Optionaler Testkontext als natives <details>/<summary>-Accordion.
         * index.css entfernt das native disclosure-Dreieck;
         * das Chevron-SVG rotiert via group-open: Tailwind-Variant.
         */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer select-none py-2 px-3 rounded-lg hover:bg-edge-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand list-none">
            <span className="text-sm font-medium text-ink">
              Zusätzlicher Testkontext{' '}
              <span className="font-normal text-ink-tertiary">(optional)</span>
            </span>
            <svg
              className="w-4 h-4 text-ink-tertiary transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </summary>
          <div className="mt-3">
            <TextArea
              id="tcg-context"
              label="Testkontext"
              value={testContext}
              onChange={onTestContextChange}
              placeholder="Browser: Chrome, Safari, Edge — Sprachen: DE, FR, IT — Viewports: 375px (Mobile), 1280px (Desktop)"
              rows={4}
              autoGrow
              disabled={isLoading}
            />
          </div>
        </details>

        {/* Fehler */}
        {error && (
          <InlineError
            message={error instanceof Error ? error.message : 'Fehler bei der Generierung. Bitte erneut versuchen.'}
          />
        )}

        {/* Generieren-Button */}
        <Button
          type="submit"
          disabled={!storyText.trim()}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testplan wird generiert…' : 'Testplan generieren'}
        </Button>

        {/* Screen Reader Status (aria-live ergänzt den visuellen Spinner im Button) */}
        <p aria-live="polite" className="sr-only">
          {isLoading ? 'Testplan wird generiert, bitte warten.' : ''}
        </p>
      </form>
    </div>
  );
}
