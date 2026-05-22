import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCasePlans } from '../../hooks/useTestCasePlans';
import { SearchBox } from '../sidebar/SearchBox';
import { TestCasePlanListItem } from './TestCasePlanListItem';
import { PanelHeader } from '../../shared/components';

export function TestCasePlanSidebar() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useTestCasePlans(q);
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full">
      <PanelHeader title="Testpläne" />

      <nav aria-label="Gespeicherte Testpläne" className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-5 pb-2 shrink-0">
          <SearchBox
            onSearch={setQ}
            placeholder="Testpläne durchsuchen…"
            ariaLabel="Testpläne durchsuchen"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span className="sr-only">Wird geladen…</span>
            </div>
          )}
          {!isLoading && data?.plans.length === 0 && (
            <p className="text-xs text-ink-tertiary text-center py-8 px-3 leading-relaxed">
              {q ? 'Keine Testpläne gefunden.' : 'Noch keine Testpläne.\nGeneriere deinen ersten!'}
            </p>
          )}
          {data?.plans.map((plan) => (
            <TestCasePlanListItem key={plan.id} plan={plan} />
          ))}
        </div>
      </nav>

      <div className="px-4 py-3.5 border-t border-edge shrink-0">
        <button
          onClick={() => navigate('/tools/test-case-generator')}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-brand bg-brand-light hover:bg-brand-light/70 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neuer Testplan
        </button>
      </div>
    </aside>
  );
}
