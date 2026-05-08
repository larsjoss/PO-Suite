import type { TestCaseType, TestLevel } from '../../types';
import { TYPE_LABELS } from './constants';

interface Props {
  availableTypes: TestCaseType[];
  selectedTypes: TestCaseType[];
  selectedLevel: TestLevel | 'all';
  onTypeToggle: (type: TestCaseType) => void;
  onResetTypes: () => void;
  onLevelChange: (level: TestLevel | 'all') => void;
  totalCount: number;
  filteredCount: number;
}

const LEVEL_OPTIONS: { id: TestLevel | 'all'; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'ENTW', label: 'ENTW' },
  { id: 'INTG', label: 'INTG' },
  { id: 'ENTW+INTG', label: 'ENTW+INTG' },
];

export function TestCaseFilterBar({
  availableTypes,
  selectedTypes,
  selectedLevel,
  onTypeToggle,
  onResetTypes,
  onLevelChange,
  totalCount,
  filteredCount,
}: Props) {
  const handleLevelKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % LEVEL_OPTIONS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + LEVEL_OPTIONS.length) % LEVEL_OPTIONS.length;
    else return;
    e.preventDefault();
    onLevelChange(LEVEL_OPTIONS[next].id);
  };

  if (availableTypes.length === 0) return null;

  return (
    <div className="bg-surface border border-edge rounded-xl p-4 space-y-3">
      {/* Testtyp-Filter */}
      <div role="group" aria-label="Nach Testtyp filtern">
        <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">
          Testtyp
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((type) => {
            const isActive = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                onClick={() => onTypeToggle(type)}
                className={[
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-canvas border border-edge text-ink-secondary hover:bg-edge-2 hover:text-ink',
                ].join(' ')}
              >
                {TYPE_LABELS[type]}
              </button>
            );
          })}
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={onResetTypes}
              className="px-2.5 py-1 rounded-full text-xs text-ink-tertiary hover:text-ink hover:bg-edge-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Teststufen-Filter + Ergebnis-Zähler */}
      <div className="flex items-center gap-4 flex-wrap">
        <div
          role="radiogroup"
          aria-label="Nach Teststufe filtern"
          className="flex rounded-lg border border-edge overflow-hidden"
        >
          {LEVEL_OPTIONS.map((opt, idx) => {
            const isActive = opt.id === selectedLevel;
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onLevelChange(opt.id)}
                onKeyDown={(e) => handleLevelKeyDown(e, idx)}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset',
                  idx > 0 ? 'border-l border-edge' : '',
                  isActive
                    ? 'bg-brand text-white focus-visible:ring-white'
                    : 'bg-surface text-ink-secondary hover:bg-edge-2 hover:text-ink focus-visible:ring-brand',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-ink-tertiary ml-auto">
          {filteredCount === totalCount
            ? `${totalCount} Testcase${totalCount !== 1 ? 's' : ''}`
            : `${filteredCount} von ${totalCount} Testcases`}
        </span>
      </div>
    </div>
  );
}
