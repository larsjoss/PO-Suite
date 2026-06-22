import type { GoalMode, GoalVariant } from '../../types';
import { Card, CardContent, CardFooter, CopyButton, MarkdownOutput, Separator } from '../../shared/components';

interface Props {
  variant: GoalVariant;
  index: number;
  mode: GoalMode;
  onRefine?: () => void;
  label?: string;
}

export function GoalVariantCard({ variant, index, mode, onRefine, label }: Props) {
  const badgeText = label ?? `Variante ${index + 1}`;

  return (
    <Card as="article" aria-label={badgeText}>
      <CardContent className="space-y-3">
        {/* Header: Badge + Kopieren */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-brand uppercase tracking-wide">
            {badgeText}
          </span>
          <CopyButton text={variant.text} label={badgeText} />
        </div>

        {/* Goal Text */}
        {mode === 'pi-objective' ? (
          <MarkdownOutput>{variant.text}</MarkdownOutput>
        ) : (
          <p className="text-sm text-ink leading-relaxed">{variant.text}</p>
        )}

        {/* Qualitätsbegründung */}
        {variant.rationale && (
          <div className="space-y-0.5">
            <Separator className="mb-3" />
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
      </CardContent>

      {onRefine && (
        <CardFooter>
          <button
            type="button"
            onClick={onRefine}
            className="text-xs font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Verfeinern →
          </button>
        </CardFooter>
      )}
    </Card>
  );
}
