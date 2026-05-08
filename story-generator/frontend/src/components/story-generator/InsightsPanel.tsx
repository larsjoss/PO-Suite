import { useEffect, useRef, useState } from 'react';
import type { Story } from '../../types';
import { useRefineStoryWithHints } from '../../hooks/useStory';
import type { HintAnswer } from '../../services/claude';
import { Button, InlineError, LoadingSkeleton, PanelHeader } from '../../shared/components';

interface Props {
  story?: Story;
  isLoading?: boolean;
  onRefiningChange?: (refining: boolean) => void;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  KRITISCH:   { label: 'Kritisch',   dot: 'bg-red-500',         text: 'text-red-700'       },
  WICHTIG:    { label: 'Wichtig',    dot: 'bg-amber-500',       text: 'text-amber-700'     },
  EMPFEHLUNG: { label: 'Empfehlung', dot: 'bg-brand/60',        text: 'text-ink-secondary' },
  HINWEIS:    { label: 'Hinweis',    dot: 'bg-ink-tertiary/50', text: 'text-ink-secondary' },
};
const CATEGORY_ORDER = ['KRITISCH', 'WICHTIG', 'EMPFEHLUNG', 'HINWEIS'] as const;

interface Category {
  name: string;
  items: string[];
}

function parseHints(raw: string): Category[] {
  const categoryMap = new Map<string, string[]>();
  for (const line of raw.split('\n')) {
    const cleaned = line.trim().replace(/\*+/g, '').replace(/^[-•]\s*/, '').trim();
    const match = cleaned.match(/^(KRITISCH|WICHTIG|EMPFEHLUNG|HINWEIS):\s*(.+)/i);
    if (match) {
      const cat = match[1].toUpperCase();
      const text = match[2].trim();
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(text);
    }
  }
  return CATEGORY_ORDER
    .filter((c) => categoryMap.has(c))
    .map((name) => ({ name, items: categoryMap.get(name)! }));
}

// ─── Auto-growing textarea ────────────────────────────────────────────────────

interface AutoTextareaProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder: string;
  id: string;
}

function AutoTextarea({ value, onChange, disabled, placeholder, id }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      rows={2}
      className="w-full resize-none overflow-hidden border border-edge rounded-lg px-3 py-2.5 text-xs text-ink bg-surface placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      style={{ minHeight: '56px' }}
    />
  );
}

// ─── Single hint card ─────────────────────────────────────────────────────────

interface HintCardProps {
  hint: string;
  answer: string;
  disabled: boolean;
  onAnswerChange: (value: string) => void;
  cardId: string;
}

function HintCard({ hint, answer, disabled, onAnswerChange, cardId }: HintCardProps) {
  const isAnswered = answer.trim().length > 0;
  const inputId = `hint-answer-${cardId}`;

  return (
    /*
     * Native <details>/<summary> disclosure — consistent with CategorySection.
     * Answered cards get a green-tinted left border accent (ANF-02).
     */
    <details className={`group rounded-lg border overflow-hidden transition-colors ${
      isAnswered ? 'border-brand/40 bg-brand-light/20' : 'border-edge bg-surface'
    }`}>
      <summary className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset disabled:cursor-not-allowed list-none [&::-webkit-details-marker]:hidden">
        {/* Answered / reply indicator */}
        <span
          className={`mt-0.5 shrink-0 transition-colors ${
            isAnswered ? 'text-brand' : 'text-ink-tertiary/40 group-hover:text-ink-tertiary'
          }`}
          aria-hidden="true"
        >
          {isAnswered ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          )}
        </span>

        <p className="text-xs text-ink leading-relaxed flex-1">{hint}</p>

        {/* Chevron */}
        <svg
          className="w-3 h-3 text-ink-tertiary shrink-0 mt-1 transition-transform duration-150 group-open:rotate-180"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      {/* Answer area (ANF-01) */}
      <div className="px-3 pb-3">
        <label htmlFor={inputId} className="sr-only">
          Antwort auf: {hint}
        </label>
        <AutoTextarea
          id={inputId}
          value={answer}
          onChange={onAnswerChange}
          disabled={disabled}
          placeholder="Antwort eingeben…"
        />
      </div>
    </details>
  );
}

// ─── Category accordion section ───────────────────────────────────────────────

interface CategorySectionProps {
  name: string;
  items: string[];
  answers: Record<string, string>;
  disabled: boolean;
  onAnswerChange: (hint: string, value: string) => void;
}

function CategorySection({
  name, items, answers, disabled, onAnswerChange,
}: CategorySectionProps) {
  const cfg = CATEGORY_CONFIG[name] ?? { label: name, dot: 'bg-edge', text: 'text-ink-secondary' };
  const answeredCount = items.filter((h) => answers[h]?.trim()).length;

  return (
    /*
     * <details>/<summary> — semantic disclosure pattern.
     * group-open:rotate-180 rotates chevron via Tailwind's group-open variant.
     */
    <details open={name === 'KRITISCH'} className="group border border-edge rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none bg-surface hover:bg-edge-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
          <span className="text-xs text-ink-tertiary tabular-nums">
            {answeredCount > 0 ? `${answeredCount}/${items.length}` : `(${items.length})`}
          </span>
        </div>
        <svg
          className="w-3.5 h-3.5 text-ink-tertiary transition-transform duration-200 group-open:rotate-180"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="divide-y divide-edge border-t border-edge space-y-0 px-3 py-3 flex flex-col gap-1.5">
        {items.map((hint, i) => (
          <HintCard
            key={hint}
            cardId={`${name}-${i}`}
            hint={hint}
            answer={answers[hint] ?? ''}
            disabled={disabled}
            onAnswerChange={(v) => onAnswerChange(hint, v)}
          />
        ))}
      </div>
    </details>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function InsightsPanel({ story, isLoading, onRefiningChange }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const refine = useRefineStoryWithHints(story?.id ?? '');

  const categories = story?.refinementHints ? parseHints(story.refinementHints) : [];
  const hasParsedCategories = categories.length > 0;
  const hasAnswers = Object.values(answers).some((a) => a.trim().length > 0);

  // Notify WorkspacePage so StoryOutputPanel can show the refinement banner (ANF-06)
  const isPending = refine.isPending;
  useEffect(() => {
    onRefiningChange?.(isPending);
  }, [isPending, onRefiningChange]);

  // Reset answers when the story changes (new generation)
  const storyId = story?.id;
  useEffect(() => {
    setAnswers({});
  }, [storyId]);

  const handleAnswerChange = (hint: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [hint]: value }));
  };

  const handleRefine = () => {
    if (!story || !hasAnswers || refine.isPending) return;

    // ANF-04: only answered pairs, no empty entries
    const hintAnswers: HintAnswer[] = Object.entries(answers)
      .filter(([, answer]) => answer.trim())
      .map(([hint, answer]) => ({ hint, answer: answer.trim() }));

    refine.mutate(
      { currentStory: story.generatedStory, hintAnswers, currentTitle: story.title },
      {
        // ANF-05: clear answers on success
        onSuccess: () => {
          setAnswers({});
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Hinweise" />

      {/* Scrollable hint content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {/* Loading skeleton */}
        {isLoading && <LoadingSkeleton lines={3} />}

        {/* Empty state */}
        {!isLoading && !story && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-9 h-9 bg-edge-2 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <p className="text-xs text-ink-tertiary leading-relaxed">
              AI-Hinweise erscheinen hier nach der Generierung der Story.
            </p>
          </div>
        )}

        {/* No hints returned */}
        {!isLoading && story && !story.refinementHints && (
          <p className="text-xs text-ink-tertiary leading-relaxed px-1">Keine offenen Punkte identifiziert.</p>
        )}

        {/* Accordion with hint cards — key=storyId re-mounts on story change, resetting all <details> */}
        {!isLoading && hasParsedCategories && (
          <div key={storyId} className="space-y-2">
            {categories.map((cat) => (
              <CategorySection
                key={cat.name}
                name={cat.name}
                items={cat.items}
                answers={answers}
                disabled={refine.isPending}
                onAnswerChange={handleAnswerChange}
              />
            ))}
          </div>
        )}

        {/* Fallback: raw text if parser found no categories */}
        {!isLoading && story?.refinementHints && !hasParsedCategories && (
          <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap px-1">
            {story.refinementHints}
          </p>
        )}
      </div>

      {/* Footer: "Story verfeinern" button (ANF-03) */}
      {story && (
        <div className="px-4 py-3.5 border-t border-edge shrink-0 space-y-2">
          {/* Inline error (ANF-07) */}
          {refine.error && (
            <InlineError
              message={
                refine.error instanceof Error
                  ? refine.error.message
                  : 'Fehler beim Verfeinern. Bitte erneut versuchen.'
              }
            />
          )}

          {/*
           * ANF-03 – active only when ≥1 answer is filled.
           * Tooltip via `title` attribute when inactive.
           */}
          <Button
            variant="outline"
            onClick={handleRefine}
            disabled={!hasAnswers}
            loading={refine.isPending}
            title={!hasAnswers ? 'Beantworte mindestens einen Hinweis, um die Story zu verfeinern.' : undefined}
            className="w-full"
          >
            {refine.isPending ? 'Wird verfeinert…' : 'Story verfeinern'}
          </Button>
        </div>
      )}
    </div>
  );
}
