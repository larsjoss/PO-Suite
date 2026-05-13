import type { GoalMode, GoalVariant } from '../../types';
import { CopyButton, MarkdownOutput } from '../../shared/components';

interface Props {
  variant: GoalVariant;
  index: number;
  mode: GoalMode;
  // Wenn gesetzt, wird "Verfeinern →"-Button angezeigt
  onRefine?: () => void;
  // Überschreibt "Variante N" im Badge (z.B. für Refinement-View)
  label?: string;
}

export function GoalVariantCard({ variant, index, mode, onRefine, label }: Props) {
  const badgeText = label ?? `Variante ${index + 1}`;

  return (
    <article
      className="bg-surface border border-edge rounded-xl p-5 space-y-3 transition-colors"
      aria-label={badgeText}
    >
      {/* Header: Badge + Kopieren-Button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-brand uppercase tracking-wide">
          {badgeText}
        </span>
        <CopyButton text={variant.text} label={badgeText} />
      </div>

      {/* Goal Text — Markdown for PI Objective (rich structure), plain <p> for Sprint Goal */}
      {mode === 'pi-objective' ? (
        <MarkdownOutput>{variant.text}</MarkdownOutput>
      ) : (
        <p className="text-sm text-ink leading-relaxed">{variant.text}</p>
      )}

      {/* Qualitätsbegründung */}
      {variant.rationale && (
        <div className="border-t border-edge pt-3 space-y-0.5">
          <p className="text-xs font-medium text-ink-secondary">Qualitätsbegründung</p>
          <p className="text-xs text-ink-tertiary leading-relaxed">{variant.rationale}</p>
        </div>
      )}

      {/* Schwachstelle */}
      {variant.weakness && (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-amber-700">Schwachstelle</p>
          <p className="text-xs text-amber-700 leading-relaxed">{variant.weakness}</p>
        </div>
      )}

      {/* Verfeinern-Button — nur wenn onRefine übergeben */}
      {onRefine && (
        <div className="pt-1 border-t border-edge">
          <button
            type="button"
            onClick={onRefine}
            className="text-xs font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Verfeinern →
          </button>
        </div>
      )}
    </article>
  );
}
