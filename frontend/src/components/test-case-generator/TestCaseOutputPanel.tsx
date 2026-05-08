import { useMemo, useState, type RefObject } from 'react';
import type { TestCase, TestCaseType, TestLevel, TestPlan } from '../../types';
import { Button } from '../../shared/components';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { buildJiraMarkdown, getAvailableTypes } from '../../services/testCaseGenerator';
import { TestCaseSummaryBlock } from './TestCaseSummaryBlock';
import { TestCaseFilterBar } from './TestCaseFilterBar';
import { TestCaseCard } from './TestCaseCard';

interface Props {
  testPlan: TestPlan;
  onReset: () => void;
  contentRef: RefObject<HTMLDivElement>;
}

export function TestCaseOutputPanel({ testPlan, onReset, contentRef }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<TestCaseType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<TestLevel | 'all'>('all');

  const { copied, copy } = useCopyToClipboard();

  const availableTypes = useMemo(
    () => getAvailableTypes(testPlan.test_cases),
    [testPlan.test_cases],
  );

  const filteredCases = useMemo<TestCase[]>(() => {
    return testPlan.test_cases.filter((tc) => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(tc.type);
      const levelMatch = selectedLevel === 'all' || tc.level === selectedLevel;
      return typeMatch && levelMatch;
    });
  }, [testPlan.test_cases, selectedTypes, selectedLevel]);

  function handleTypeToggle(type: TestCaseType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function handleResetTypes() {
    setSelectedTypes([]);
  }

  return (
    /*
     * tabIndex={-1}: ermöglicht programmatischen Fokus nach Generierung (WCAG 2.4.3).
     * aria-live="polite": meldet neuen Inhalt an Screen Reader.
     */
    <div
      ref={contentRef}
      tabIndex={-1}
      aria-live="polite"
      role="region"
      aria-label="Generierter Testplan"
      className="outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
    >
      {/* Header-Leiste */}
      <div className="sticky top-0 z-10 bg-canvas border-b border-edge px-6 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-widest">
            Testplan
          </p>
          <p className="text-xs text-ink-tertiary mt-0.5">
            {testPlan.summary.total_count} Testcases generiert
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          aria-label="Zurück zur Eingabe, neuen Testplan generieren"
        >
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
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Neu generieren
        </Button>
      </div>

      {/* Inhalt */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* Summary */}
        <TestCaseSummaryBlock
          summary={testPlan.summary}
          storyTitle={testPlan.story_title}
        />

        {/* Filter */}
        <TestCaseFilterBar
          availableTypes={availableTypes}
          selectedTypes={selectedTypes}
          selectedLevel={selectedLevel}
          onTypeToggle={handleTypeToggle}
          onResetTypes={handleResetTypes}
          onLevelChange={setSelectedLevel}
          totalCount={testPlan.test_cases.length}
          filteredCount={filteredCases.length}
        />

        {/* Testcase-Liste */}
        {filteredCases.length > 0 ? (
          <ol aria-label="Testcases" className="space-y-4 list-none p-0">
            {filteredCases.map((tc) => (
              <TestCaseCard key={tc.id} testCase={tc} />
            ))}
          </ol>
        ) : (
          <div className="text-center py-10 text-sm text-ink-tertiary">
            Keine Testcases entsprechen dem aktuellen Filter.
          </div>
        )}

        {/* "Alles kopieren" — vollbreiter Primary-Button am Ende des scrollbaren Outputs */}
        <Button
          variant="primary"
          className="w-full"
          onClick={() => copy(buildJiraMarkdown(testPlan))}
          aria-label={copied ? 'Jira-Markdown kopiert' : 'Gesamten Testplan als Jira-Markdown kopieren'}
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Kopiert!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Alles kopieren (Jira-Markdown)
            </>
          )}
        </Button>

        {/* Padding am Ende */}
        <div className="h-4" aria-hidden="true" />
      </div>
    </div>
  );
}
