import type { KeyboardEvent } from 'react';

interface Tab<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Prefix for generated `id` and `aria-controls` attributes: `{idPrefix}-tab-{id}` / `{idPrefix}-panel-{id}` */
  idPrefix?: string;
  'aria-label'?: string;
  className?: string;
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  disabled,
  idPrefix = '',
  'aria-label': ariaLabel,
  className = '',
}: TabBarProps<T>) {
  const tabId = (id: T) => [idPrefix, 'tab', id].filter(Boolean).join('-');
  const panelId = (id: T) => [idPrefix, 'panel', id].filter(Boolean).join('-');

  const handleKeyDown = (e: KeyboardEvent, idx: number) => {
    let next: number;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex border-b border-edge ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            id={tabId(tab.id)}
            aria-selected={isActive}
            aria-controls={panelId(tab.id)}
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
