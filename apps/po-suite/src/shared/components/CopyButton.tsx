import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Inhalt' }: Props) {
  const { copied, copy } = useCopyToClipboard();

  return (
    /*
     * WCAG 2.4.7 – Focus Visible / 4.1.2 – Name, Role, Value
     * aria-live="polite" meldet Statuswechsel an Screen Reader.
     */
    <button
      onClick={() => copy(text)}
      aria-label={copied ? `${label} kopiert` : `${label} kopieren`}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-secondary bg-edge/60 hover:bg-edge rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600" aria-live="polite">Kopiert!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span aria-live="polite">Kopieren</span>
        </>
      )}
    </button>
  );
}
