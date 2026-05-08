import type { FormEvent } from 'react';
import type { PiObjectiveInput } from '../../types';
import { Button, TextArea, InlineError } from '../../shared/components';

const INPUT_CLASS =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

const OPTIONAL_HINT = (
  <span className="font-normal text-xs text-ink-tertiary"> – Optional – beeinflusst den Output</span>
);

interface Props {
  input: PiObjectiveInput;
  isLoading: boolean;
  error: Error | null;
  onChange: (patch: Partial<PiObjectiveInput>) => void;
  onSubmit: (e: FormEvent) => void;
}

export function PiObjectiveInputPanel({ input, isLoading, error, onChange, onSubmit }: Props) {
  const submitDisabled = !input.featureTitle.trim() || !input.featureDescription.trim();

  return (
    <form
      id="gg-panel-pi-objective"
      role="tabpanel"
      aria-labelledby="gg-tab-pi-objective"
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
    >
      {/* ART-Feature Titel — Pflicht */}
      <div>
        <label htmlFor="gg-feature-title" className="block text-sm font-medium text-ink mb-1">
          ART-Feature Titel
        </label>
        <input
          id="gg-feature-title"
          type="text"
          value={input.featureTitle}
          onChange={(e) => onChange({ featureTitle: e.target.value })}
          placeholder="z.B. Automatische Schadensmeldung via Mobile"
          disabled={isLoading}
          className={INPUT_CLASS}
        />
      </div>

      {/* ART-Feature Beschreibung — Pflicht */}
      <div>
        <TextArea
          id="gg-feature-description"
          label="ART-Feature Beschreibung"
          value={input.featureDescription}
          onChange={(val) => onChange({ featureDescription: val })}
          placeholder={'Feature-Text inkl. Akzeptanzkriterien, Kontext, Ziel…'}
          rows={8}
          autoGrow
          disabled={isLoading}
        />
        <p className="mt-1.5 text-xs text-ink-tertiary leading-relaxed">
          Tipp: Je mehr Kontext du mitgibst – Problemstellung, betroffene Nutzer, erwarteter Nutzen –
          desto stärker wird der Outcome-Paragraph im Output.
        </p>
      </div>

      {/* Jira-Referenz — Optional */}
      <div>
        <label htmlFor="gg-jira-ref" className="block text-sm font-medium text-ink mb-1">
          Jira-Referenz{OPTIONAL_HINT}
        </label>
        <input
          id="gg-jira-ref"
          type="text"
          value={input.jiraReference}
          onChange={(e) => onChange({ jiraReference: e.target.value })}
          placeholder="z.B. ART-29149"
          disabled={isLoading}
          className={INPUT_CLASS}
        />
      </div>

      {/* Abnahme-Gruppe — Optional */}
      <fieldset className="space-y-3" disabled={isLoading}>
        <legend className="text-sm font-medium text-ink">
          Abnahme{OPTIONAL_HINT}
        </legend>

        {/* Abnahme durch — volle Breite */}
        <div>
          <label htmlFor="gg-accepted-by" className="block text-xs text-ink-secondary mb-1">
            Abnahme durch
          </label>
          <input
            id="gg-accepted-by"
            type="text"
            value={input.acceptedBy}
            onChange={(e) => onChange({ acceptedBy: e.target.value })}
            placeholder="z.B. Max Muster, Anna Beispiel"
            className={INPUT_CLASS}
          />
        </div>

        {/* Abnahme-Datum + Abnahme-Stufe nebeneinander */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gg-acceptance-date" className="block text-xs text-ink-secondary mb-1">
              Abnahme-Datum
            </label>
            <input
              id="gg-acceptance-date"
              type="date"
              value={input.acceptanceDate}
              onChange={(e) => onChange({ acceptanceDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="gg-acceptance-level" className="block text-xs text-ink-secondary mb-1">
              Abnahme-Stufe
            </label>
            <input
              id="gg-acceptance-level"
              type="text"
              value={input.acceptanceLevel}
              onChange={(e) => onChange({ acceptanceLevel: e.target.value })}
              placeholder="z.B. INTG"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </fieldset>

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
