interface Props {
  source: string;
  onDismiss: () => void;
}

export function HandoffBanner({ source, onDismiss }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-ink mb-4"
    >
      <span>
        Kontext aus <strong>{source}</strong> übernommen — bitte vor der Generierung prüfen.
      </span>
      <button
        onClick={onDismiss}
        aria-label="Banner schliessen"
        className="shrink-0 rounded p-1 text-ink-secondary hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand"
      >
        ✕
      </button>
    </div>
  );
}
