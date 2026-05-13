import { useEffect, useRef } from 'react';
import type { Story } from '../../types';
import { LoadingSkeleton, Button, MarkdownOutput, PanelHeader } from '../../shared/components';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { formatStoryMarkdown } from '../../services/claude';

interface Props {
  story?: Story;
  isLoading?: boolean;
  isGenerating?: boolean;
  isRefining?: boolean;
}

export function StoryOutputPanel({ story, isLoading, isGenerating, isRefining }: Props) {
  const outputRef = useRef<HTMLDivElement>(null);
  const wasGenerating = useRef(false);
  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    if (wasGenerating.current && !isGenerating && story) {
      outputRef.current?.focus();
    }
    wasGenerating.current = isGenerating ?? false;
  }, [isGenerating, story]);

  const busy = isGenerating ?? false;

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Story" />

      {/* Non-blocking refinement banner (ANF-06) */}
      {isRefining && (
        <div className="shrink-0 px-5 py-2 bg-brand-light border-b border-brand/20 flex items-center gap-2" role="status" aria-live="polite">
          <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-brand">Story wird verfeinert…</span>
        </div>
      )}

      {/*
       * WCAG 2.4.7 – tabIndex={-1}: nur programmatisch fokussierbar.
       * WCAG 1.3.1 – aria-label benennt den Bereich für Screenreader.
       */}
      <div
        ref={outputRef}
        tabIndex={-1}
        aria-busy={busy}
        aria-live="polite"
        aria-label="Generierte Story"
        className="flex-1 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
      >
        {/* Load / generate skeleton */}
        {(isLoading || (busy && !story)) && (
          <div className="px-6 py-5">
            <LoadingSkeleton lines={7} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !story && !busy && (
          <div className="flex flex-col items-center justify-center h-full min-h-64 text-center p-10">
            <div className="w-11 h-11 bg-edge-2 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-ink-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-ink-tertiary leading-relaxed">
              Gib eine Anforderung ein und klicke auf „Story generieren".
            </p>
          </div>
        )}

        {/* Story content + copy button scrolling together */}
        {!isLoading && story && (
          <div className="px-6 py-5">
            <MarkdownOutput>{formatStoryMarkdown(story.generatedStory)}</MarkdownOutput>

            {/*
             * WCAG 4.1.2 – aria-label benennt die Aktion; aria-live="polite".
             * Full-width am Ende des Inhalts: bewusste UX (erst lesen, dann kopieren).
             */}
            <Button
              onClick={() => story && copy(story.generatedStory)}
              variant="primary"
              aria-label={copied ? 'Story kopiert' : 'Story kopieren'}
              className="mt-6 w-full"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kopiert!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Kopieren
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
