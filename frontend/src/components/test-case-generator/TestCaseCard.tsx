import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { buildSingleTcMarkdown } from '../../services/testCaseGenerator';
import type { TestCase } from '../../types';
import { TYPE_BADGE_COLORS, TYPE_LABELS, LEVEL_BADGE_COLORS } from './constants';

interface Props {
  testCase: TestCase;
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  open_question: 'Offene Frage',
  dependency: 'Abhängigkeit',
  risk: 'Risiko',
  assumption: 'Annahme',
};

const SOURCE_LABELS: Record<string, string> = {
  story_ak: 'Story-AK',
  screenshot: 'Screenshot',
  test_context: 'Testkontext',
  model_addition: 'Modell-Ergänzung',
};

export function TestCaseCard({ testCase: tc }: Props) {
  const { copied, copy } = useCopyToClipboard();
  const hasFlag = !!tc.flag;

  return (
    <li
      className={[
        'rounded-xl border p-5 space-y-4',
        hasFlag ? 'bg-amber-50 border-amber-300' : 'bg-surface border-edge',
      ].join(' ')}
    >
      {/* Header: ID + Badges + Titel + Kopieren */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono font-semibold text-ink-tertiary">{tc.id}</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_COLORS[tc.type]}`}
            >
              {TYPE_LABELS[tc.type]}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_BADGE_COLORS[tc.level]}`}
            >
              {tc.level}
            </span>
            {tc.linked_aks.length > 0 && (
              <span className="text-xs text-ink-tertiary">→ {tc.linked_aks.join(', ')}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-ink leading-snug">{tc.title}</h3>
        </div>

        <button
          type="button"
          onClick={() => copy(buildSingleTcMarkdown(tc))}
          aria-label={`${tc.id} als Markdown kopieren`}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-edge-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {copied ? (
            <>
              <svg
                className="w-3.5 h-3.5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700">Kopiert</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Kopieren</span>
            </>
          )}
        </button>
      </div>

      {/* Flag-Callout */}
      {tc.flag && (
        <div className="flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2.5 text-sm text-amber-900">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <span className="font-semibold">
              {FLAG_TYPE_LABELS[tc.flag.type] ?? tc.flag.type}:
            </span>{' '}
            {tc.flag.message}
          </div>
        </div>
      )}

      {/* Voraussetzungen */}
      {tc.preconditions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">
            Voraussetzungen
          </h4>
          <ul className="space-y-0.5">
            {tc.preconditions.map((pre, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="text-ink-tertiary shrink-0">•</span>
                {pre}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Schritte */}
      {tc.steps.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">
            Schritte
          </h4>
          <ol className="space-y-0.5">
            {tc.steps.map((s) => (
              <li key={s.step} className="flex gap-2 text-sm text-ink">
                <span className="text-ink-tertiary shrink-0 font-medium">{s.step}.</span>
                {s.action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Erwartetes Ergebnis */}
      <div>
        <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">
          Erwartetes Ergebnis
        </h4>
        <p className="text-sm text-ink">{tc.expected_result}</p>
      </div>

      {/* Footer */}
      <div className="pt-1 border-t border-edge">
        <span className="text-xs text-ink-tertiary">
          Quelle: {SOURCE_LABELS[tc.source] ?? tc.source}
        </span>
      </div>
    </li>
  );
}
