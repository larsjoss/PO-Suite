import type { RefObject } from 'react';
import { Button, InlineError, LoadingSkeleton, MarkdownOutput, PanelHeader } from '../../shared/components';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface Props {
  markdown: string;
  isLoading: boolean;
  error?: Error | null;
  onRegenerate: () => void;
  onReset: () => void;
  contentRef: RefObject<HTMLDivElement>;
}

export function DocGeneratorOutputPanel({
  markdown,
  isLoading,
  error,
  onRegenerate,
  onReset,
  contentRef,
}: Props) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-8"
      role="region"
      aria-label="Generierte Dokumentation"
    >
      <PanelHeader title="Generierte Dokumentation" />

      <div
        ref={contentRef}
        tabIndex={-1}
        aria-live="polite"
        aria-busy={isLoading}
        className="outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset rounded"
      >
        {isLoading && (
          <div className="py-5">
            <p className="text-sm text-ink-secondary mb-4">Dokumentation wird generiert…</p>
            <LoadingSkeleton lines={10} />
          </div>
        )}

        {!isLoading && markdown && (
          <div className="py-5">
            <MarkdownOutput>{markdown}</MarkdownOutput>

            <div className="mt-8 space-y-3">
              <Button
                onClick={() => copy(markdown)}
                variant="primary"
                aria-label={copied ? 'Dokumentation kopiert' : 'Dokumentation kopieren'}
                className="w-full"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span aria-live="polite">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span aria-live="polite">Kopieren</span>
                  </>
                )}
              </Button>

              <Button
                onClick={onRegenerate}
                variant="secondary"
                disabled={isLoading}
                className="w-full"
              >
                Neu generieren
              </Button>

              {error && (
                <InlineError message={error.message} />
              )}

              <Button
                onClick={onReset}
                variant="outline"
                disabled={isLoading}
                className="w-full"
              >
                Zurücksetzen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
