import type { UseCase } from '../../hooks/useTextPolisher';

interface Tab {
  id: UseCase;
  label: string;
}

const TABS: Tab[] = [
  { id: 'email', label: 'E-Mail' },
  { id: 'meeting', label: 'Meeting-Summary' },
  { id: 'freetext', label: 'Freitext' },
];

interface Props {
  value: UseCase;
  onChange: (useCase: UseCase) => void;
  disabled?: boolean;
}

export function UseCaseSelector({ value, onChange, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
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
    /*
     * WCAG 4.1.2 – role="tablist" / role="tab" für Use-Case-Auswahl (UI-06).
     * Arrow-Key-Navigation entspricht dem ARIA Authoring Practices Guide.
     */
    <div
      role="tablist"
      aria-label="Use Case auswählen"
      className="flex border-b border-edge"
    >
      {TABS.map((tab, idx) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tp-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={isActive ? `tp-panel-${tab.id}` : undefined}
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
