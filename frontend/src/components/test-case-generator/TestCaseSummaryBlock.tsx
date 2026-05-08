import type { TestPlanSummary } from '../../types';
import { TYPE_LABELS } from './constants';

interface Props {
  summary: TestPlanSummary;
  storyTitle: string;
}

export function TestCaseSummaryBlock({ summary, storyTitle }: Props) {
  const entw = (summary.by_level['ENTW'] ?? 0) + (summary.by_level['ENTW+INTG'] ?? 0);
  const intg = (summary.by_level['INTG'] ?? 0) + (summary.by_level['ENTW+INTG'] ?? 0);

  return (
    <section
      aria-labelledby="summary-heading"
      className="bg-surface border border-edge rounded-xl p-5 space-y-4"
    >
      {/* Titel + Kennzahlen */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 id="summary-heading" className="font-serif text-lg font-semibold text-ink">
          {storyTitle}
        </h2>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="font-semibold text-ink">{summary.total_count} TCs</span>
          <span className="text-ink-tertiary" aria-hidden="true">|</span>
          <span className="text-ink-secondary">ENTW: {entw}</span>
          <span className="text-ink-tertiary" aria-hidden="true">|</span>
          <span className="text-ink-secondary">INTG: {intg}</span>
        </div>
      </div>

      {/* Verteilung nach Testtyp */}
      {Object.keys(summary.by_type).length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Testcases nach Typ">
          {(Object.entries(summary.by_type) as [string, number][])
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-edge-2 text-xs text-ink-secondary"
              >
                <span className="font-semibold text-ink">{count}×</span>
                {TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type}
              </span>
            ))}
        </div>
      )}

      {/* AK-Coverage */}
      {summary.ak_coverage.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">
            AK-Coverage
          </h3>
          <ul className="space-y-1.5">
            {summary.ak_coverage.map((ak) => (
              <li key={ak.ak_id} className="flex items-center gap-2 text-sm">
                {ak.covered ? (
                  <svg
                    className="w-4 h-4 shrink-0 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Abgedeckt"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 shrink-0 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Nicht abgedeckt"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={ak.covered ? 'text-ink' : 'text-ink-secondary'}>
                  <span className="font-medium">{ak.ak_id}</span>
                  {ak.covered
                    ? ` — ${ak.tc_count} TC${ak.tc_count !== 1 ? 's' : ''}`
                    : ' — nicht vollständig testbar'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lücken */}
      {summary.gaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">
            <svg
              className="w-3.5 h-3.5 shrink-0"
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
            Lücken
          </div>
          <ul className="space-y-0.5">
            {summary.gaps.map((gap, i) => (
              <li key={i} className="text-sm text-amber-800">
                • {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risikohinweise */}
      {summary.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-800 uppercase tracking-wide">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Risikohinweise
          </div>
          <ul className="space-y-0.5">
            {summary.risk_flags.map((flag, i) => (
              <li key={i} className="text-sm text-red-800">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
