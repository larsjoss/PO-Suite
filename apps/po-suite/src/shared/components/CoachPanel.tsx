import { useState } from 'react';
import type { CoachConfig, CoachStep } from '../types/coach';

interface CoachPanelProps {
  config: CoachConfig;
  onDismiss: () => void;
  onDismissForever: () => void;
  onStepToggle: (stepId: string) => void;
  onNavigate?: (target: string) => void;
  toggledSteps?: Set<string>;
}

export function CoachPanel({
  config,
  onDismiss,
  onDismissForever,
  onStepToggle,
  onNavigate,
  toggledSteps = new Set(),
}: CoachPanelProps) {
  const [confirmingForever, setConfirmingForever] = useState(false);

  const sortedSuggestions = [...config.suggestions]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  function isStepDone(step: CoachStep): boolean {
    if (step.done) return true;
    if (step.doneBy === 'manual') return toggledSteps.has(step.id);
    return false;
  }

  return (
    <aside
      aria-label="PO-Coach: Nächste Schritte"
      className="xl:fixed xl:right-4 xl:top-[56px] xl:w-72 xl:max-h-[calc(100vh-72px)] xl:overflow-y-auto
                 bg-surface border border-edge rounded-xl shadow-sm p-4 space-y-4 mt-4 xl:mt-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-sm font-semibold text-ink">Nächste Schritte</h2>
        <button
          onClick={onDismiss}
          aria-label="Coach ausblenden"
          className="text-ink-secondary hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Checkliste */}
      <section>
        <h3 className="text-xs font-medium text-ink-secondary uppercase tracking-wide mb-2">
          Was ist erledigt?
        </h3>
        <ul className="space-y-1.5">
          {config.completedSteps.map((step) => {
            const done = isStepDone(step);
            return (
              <li key={step.id} className="flex items-center gap-2">
                {step.doneBy === 'manual' && !step.done ? (
                  <input
                    type="checkbox"
                    id={`coach-step-${step.id}`}
                    checked={toggledSteps.has(step.id)}
                    onChange={() => onStepToggle(step.id)}
                    className="w-3.5 h-3.5 rounded border-edge accent-brand shrink-0"
                    aria-label={step.label}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`w-3.5 h-3.5 shrink-0 rounded-full flex items-center justify-center ${
                      done ? 'bg-success/20 text-success' : 'bg-edge text-ink-tertiary'
                    }`}
                  >
                    {done && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                )}
                <label
                  htmlFor={step.doneBy === 'manual' && !step.done ? `coach-step-${step.id}` : undefined}
                  className={`text-xs cursor-default ${
                    done ? 'text-ink-tertiary line-through' : 'text-ink'
                  }`}
                >
                  {step.label}
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Empfehlungen */}
      <section>
        <h3 className="text-xs font-medium text-ink-secondary uppercase tracking-wide mb-2">
          Was als nächstes?
        </h3>
        <ul className="space-y-2">
          {sortedSuggestions.map((suggestion) => (
            <li key={suggestion.id}>
              {suggestion.actionType === 'navigate' && suggestion.actionTarget ? (
                <button
                  onClick={() => onNavigate?.(suggestion.actionTarget!)}
                  className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
                >
                  <div className="rounded-lg border border-edge p-2.5 hover:border-brand hover:bg-brand/5 transition-colors">
                    <p className="text-xs font-medium text-ink group-hover:text-brand transition-colors">
                      {suggestion.label}
                    </p>
                    <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                      {suggestion.rationale}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-lg border border-edge p-2.5 bg-canvas">
                  <p className="text-xs font-medium text-ink">{suggestion.label}</p>
                  <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                    {suggestion.rationale}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Sprint-Kontext (Accordion) */}
      {config.sprintContextText && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-ink-secondary hover:text-ink transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
            Sprint-Kontext
          </summary>
          <p className="mt-2 text-ink-secondary leading-relaxed pl-1">
            {config.sprintContextText}
          </p>
        </details>
      )}

      {/* Dauerhaft ausblenden */}
      <div className="pt-1 border-t border-edge">
        {confirmingForever ? (
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <span>Wirklich immer ausblenden?</span>
            <button
              onClick={onDismissForever}
              className="text-error font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              Ja
            </button>
            <button
              onClick={() => setConfirmingForever(false)}
              className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              Nein
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingForever(true)}
            className="text-xs text-ink-secondary hover:text-ink underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Immer ausblenden
          </button>
        )}
      </div>
    </aside>
  );
}
