import type { KeyboardEvent } from 'react';
import type { GoalMode } from '../../types';

interface Tab {
  id: GoalMode;
  label: string;
}

const TABS: Tab[] = [
  { id: 'sprint-goal', label: 'Sprint Goal' },
  { id: 'pi-objective', label: 'PI Objective' },
];

interface Props {
  value: GoalMode;
  onChange: (mode: GoalMode) => void;
  disabled?: boolean;
}

export function GoalTabSelector({ value, onChange, disabled }: Props) {
  const handleKeyDown = (e: KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    onChange(TABS[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label="Modus auswählen"
      className="flex border-b border-edge"
    >
      {TABS.map((tab, idx) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`gg-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={isActive ? `gg-panel-${tab.id}` : undefined}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'flex-1 py-3 text-xs font-medium transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-secondary hover:text-ink hover:border-edge',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
