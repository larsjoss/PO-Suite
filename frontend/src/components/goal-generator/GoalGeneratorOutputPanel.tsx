import type { FormEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { GoalMode, GoalVariant } from '../../types';
import { Button, InlineError, LoadingSkeleton, PanelHeader } from '../../shared/components';
import { GoalVariantCard } from './GoalVariantCard';

const REFINE_PLACEHOLDER: Record<GoalMode, string> = {
  'sprint-goal': 'z.B. "Mehr Fokus auf Business-Nutzen", "Kürzer", "Weniger technisch"',
  'pi-objective': 'z.B. "Stärkerer Fokus auf Nutzen für Versicherte", "Outcome-Paragraph prägnanter", "Problemkontext ausbauen"',
};

interface Props {
  mode: GoalMode;

  // Variants-View
  variants: GoalVariant[];
  isGenerating: boolean;
  generateError: Error | null;
  onRegenerate: () => void;
  onReset: () => void;
  onSelectForRefine: (variant: GoalVariant) => void;

  // Refining-View
  outputView: 'variants' | 'refining';
  selectedVariant: GoalVariant | null;
  refinedVariant: GoalVariant | null;
  refinementHint: string;
  isRefining: boolean;
  refineError: Error | null;
  onRefinementHintChange: (hint: string) => void;
  onRefineSubmit: (e: FormEvent) => void;
  onBackToVariants: () => void;

  contentRef: RefObject<HTMLDivElement>;
}

export function GoalGeneratorOutputPanel({
  mode,
  variants,
  isGenerating,
  generateError,
  onRegenerate,
  onReset,
  onSelectForRefine,
  outputView,
  selectedVariant,
  refinedVariant,
  refinementHint,
  isRefining,
  refineError,
  onRefinementHintChange,
  onRefineSubmit,
  onBackToVariants,
  contentRef,
}: Props) {
  const refineInputRef = useRef<HTMLTextAreaElement>(null);

  // Fokus auf Refinement-Input wenn View wechselt (WCAG 2.4.3)
  useEffect(() => {
    if (outputView === 'refining') {
      refineInputRef.current?.focus();
    }
  }, [outputView]);

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-8"
      role="region"
      aria-label="Generierte Varianten"
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        aria-live="polite"
        aria-busy={isGenerating}
        className="outline-none"
      >
        {/* ── Ladezustand ── */}
        {isGenerating && (
          <div className="py-5">
            <p className="text-sm text-ink-secondary mb-4">Vorschläge werden generiert…</p>
            <LoadingSkeleton lines={8} />
          </div>
        )}

        {/* ── Variants-View ── */}
        {!isGenerating && outputView === 'variants' && variants.length > 0 && (
          <div className="space-y-6">
            <PanelHeader title="Generierte Varianten" />

            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <GoalVariantCard
                  key={idx}
                  variant={variant}
                  index={idx}
                  mode={mode}
                  onRefine={() => onSelectForRefine(variant)}
                />
              ))}
            </div>

            {generateError && <InlineError message={generateError.message} />}

            <div className="space-y-3 pt-2">
              <Button onClick={onRegenerate} variant="secondary" disabled={isGenerating} className="w-full">
                Neu generieren
              </Button>
              <Button onClick={onReset} variant="outline" disabled={isGenerating} className="w-full">
                Zurücksetzen
              </Button>
            </div>
          </div>
        )}

        {/* ── Refining-View ── */}
        {!isGenerating && outputView === 'refining' && selectedVariant && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBackToVariants}
                className="flex items-center gap-1 text-xs text-ink-secondary hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück zu allen Varianten
              </button>
            </div>

            <PanelHeader title="Variante verfeinern" />

            {/* Aktuelle Variante (ausgewählt oder bereits verfeinert) */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wide">
                {refinedVariant ? 'Verfeinerte Variante' : 'Ausgewählte Variante'}
              </p>
              <GoalVariantCard
                variant={refinedVariant ?? selectedVariant}
                index={0}
                mode={mode}
                label={refinedVariant ? 'Verfeinerte Variante' : 'Ausgewählte Variante'}
              />
            </div>

            {/* Refinement-Formular */}
            <form onSubmit={onRefineSubmit} className="space-y-4">
              <div>
                <label htmlFor="gg-refine-hint" className="block text-sm font-medium text-ink mb-1">
                  Verfeinerungshinweis
                </label>
                <textarea
                  id="gg-refine-hint"
                  ref={refineInputRef}
                  value={refinementHint}
                  onChange={(e) => onRefinementHintChange(e.target.value)}
                  placeholder={REFINE_PLACEHOLDER[mode]}
                  rows={3}
                  disabled={isRefining}
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {refineError && <InlineError message={refineError.message} />}

              <Button
                type="submit"
                disabled={!refinementHint.trim() || isRefining}
                loading={isRefining}
                className="w-full"
              >
                {isRefining
                  ? 'Wird verfeinert…'
                  : refinedVariant
                    ? 'Erneut verfeinern'
                    : 'Verfeinern'}
              </Button>

              <p aria-live="polite" className="sr-only">
                {isRefining ? 'Variante wird verfeinert, bitte warten.' : ''}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
