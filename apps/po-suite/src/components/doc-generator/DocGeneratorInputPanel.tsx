import type { FormEvent } from 'react';
import type { DocMode, StoryDocInput, FeatureDocInput, UploadedFile } from '../../types';
import { Button, TextArea, InlineError, ScreenshotUpload } from '../../shared/components';
import { DocModeSelector } from './DocModeSelector';

interface Props {
  mode: DocMode;
  storyInput: StoryDocInput;
  featureInput: FeatureDocInput;
  screenshots: UploadedFile[];
  isLoading: boolean;
  error: Error | null;
  onModeChange: (mode: DocMode) => void;
  onStoryChange: (patch: Partial<StoryDocInput>) => void;
  onFeatureChange: (patch: Partial<FeatureDocInput>) => void;
  onScreenshotsChange: (files: UploadedFile[]) => void;
  onSubmit: (e: FormEvent) => void;
}

export function DocGeneratorInputPanel({
  mode,
  storyInput,
  featureInput,
  screenshots,
  isLoading,
  error,
  onModeChange,
  onStoryChange,
  onFeatureChange,
  onScreenshotsChange,
  onSubmit,
}: Props) {
  const isStory = mode === 'story';

  const titleValue = isStory ? storyInput.title : featureInput.title;
  const descriptionValue = isStory ? storyInput.description : featureInput.description;

  const submitDisabled = isStory
    ? !storyInput.title.trim() || !storyInput.description.trim()
    : !featureInput.title.trim() || !featureInput.description.trim() || !featureInput.stories.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-1">Doc Generator</h1>
        <p className="text-sm text-ink-secondary">
          Fachtechnische Dokumentation für Confluence automatisch generieren.
        </p>
      </div>

      <DocModeSelector value={mode} onChange={onModeChange} disabled={isLoading} />

      <form
        id={`dg-panel-${mode}`}
        role="tabpanel"
        aria-labelledby={`dg-tab-${mode}`}
        onSubmit={onSubmit}
        className="space-y-5"
        noValidate
      >
        {/* Titel — Pflicht in beiden Modes */}
        <div>
          <label htmlFor="dg-title" className="block text-sm font-medium text-ink mb-1">
            {isStory ? 'Story-Titel' : 'Feature-Titel'}
          </label>
          <input
            id="dg-title"
            type="text"
            value={titleValue}
            onChange={(e) =>
              isStory
                ? onStoryChange({ title: e.target.value })
                : onFeatureChange({ title: e.target.value })
            }
            placeholder={isStory ? 'z.B. Login mit E-Mail und Passwort' : 'z.B. Benutzerverwaltung'}
            disabled={isLoading}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Beschreibung — Pflicht in beiden Modes */}
        <TextArea
          id="dg-description"
          label={isStory ? 'Story-Beschreibung / Akzeptanzkriterien' : 'Feature-Beschreibung'}
          value={descriptionValue}
          onChange={(val) =>
            isStory ? onStoryChange({ description: val }) : onFeatureChange({ description: val })
          }
          placeholder={
            isStory
              ? 'Als Nutzer möchte ich...\n\nAK-1: ...\nAK-2: ...'
              : 'Übergeordnete Beschreibung des Features, Ziel und Mehrwert für Nutzer und Business.'
          }
          rows={8}
          autoGrow
          disabled={isLoading}
        />

        {/* Enthaltene Stories — Pflicht nur in Feature Mode */}
        {!isStory && (
          <TextArea
            id="dg-stories"
            label="Enthaltene Stories"
            value={featureInput.stories}
            onChange={(val) => onFeatureChange({ stories: val })}
            placeholder={'Story 1: Als Nutzer möchte ich...\nStory 2: Als Admin möchte ich...'}
            rows={5}
            autoGrow
            disabled={isLoading}
          />
        )}

        {/* Screenshots — optional */}
        <ScreenshotUpload
          files={screenshots}
          onChange={onScreenshotsChange}
          disabled={isLoading}
          maxFiles={isStory ? 3 : 1}
        />

        {/* Confluence-Spezifikation — optional */}
        <TextArea
          id="dg-confluence"
          label="Confluence-Spezifikation – Optional"
          value={isStory ? storyInput.confluenceSpec : featureInput.confluenceSpec}
          onChange={(val) =>
            isStory
              ? onStoryChange({ confluenceSpec: val })
              : onFeatureChange({ confluenceSpec: val })
          }
          placeholder="Freitext aus Confluence: Spezifikation, Kommentare, Notizen…"
          rows={4}
          autoGrow
          disabled={isLoading}
        />

        {/* Code — optional */}
        <TextArea
          id="dg-code"
          label={isStory ? 'Code / PR-Beschreibung – Optional' : 'Code / Architekturnotizen – Optional'}
          value={isStory ? storyInput.code : featureInput.code}
          onChange={(val) =>
            isStory ? onStoryChange({ code: val }) : onFeatureChange({ code: val })
          }
          placeholder={
            isStory
              ? 'PR-Beschreibung, relevante Code-Snippets oder Dateiinhalte…'
              : 'Technische Details, relevante Implementierungsentscheide, Schnittstellen…'
          }
          rows={4}
          autoGrow
          disabled={isLoading}
        />

        {/* Mode-spezifische optionale Felder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isStory ? (
            <div>
              <label htmlFor="dg-accepted-by" className="block text-sm font-medium text-ink mb-1">
                Abnahme durch <span className="font-normal text-ink-tertiary">– Optional</span>
              </label>
              <input
                id="dg-accepted-by"
                type="text"
                value={storyInput.acceptedBy}
                onChange={(e) => onStoryChange({ acceptedBy: e.target.value })}
                placeholder="Name der abnehmenden Person"
                disabled={isLoading}
                className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="dg-responsible" className="block text-sm font-medium text-ink mb-1">
                Verantwortlich <span className="font-normal text-ink-tertiary">– Optional</span>
              </label>
              <input
                id="dg-responsible"
                type="text"
                value={featureInput.responsible}
                onChange={(e) => onFeatureChange({ responsible: e.target.value })}
                placeholder="Name des verantwortlichen PO oder BA"
                disabled={isLoading}
                className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label htmlFor="dg-deployment-date" className="block text-sm font-medium text-ink mb-1">
              Deployment-Datum <span className="font-normal text-ink-tertiary">– Optional</span>
            </label>
            <input
              id="dg-deployment-date"
              type="date"
              value={isStory ? storyInput.deploymentDate : featureInput.deploymentDate}
              onChange={(e) =>
                isStory
                  ? onStoryChange({ deploymentDate: e.target.value })
                  : onFeatureChange({ deploymentDate: e.target.value })
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Fehler */}
        {error && (
          <InlineError
            message={
              error instanceof Error
                ? error.message
                : 'Fehler bei der Generierung. Bitte erneut versuchen.'
            }
          />
        )}

        <Button
          type="submit"
          disabled={submitDisabled}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Dokumentation wird generiert…' : 'Dokumentation generieren'}
        </Button>

        <p aria-live="polite" className="sr-only">
          {isLoading ? 'Dokumentation wird generiert, bitte warten.' : ''}
        </p>
      </form>
    </div>
  );
}
