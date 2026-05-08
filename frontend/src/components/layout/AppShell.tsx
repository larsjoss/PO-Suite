import { ReactNode, useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';

type TabId = 'anforderung' | 'story' | 'refinement';

const TABS: { id: TabId; label: string }[] = [
  { id: 'anforderung', label: 'Anforderung' },
  { id: 'story', label: 'Story' },
  { id: 'refinement', label: 'Refinement' },
];

interface Props {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function AppShell({ leftPanel, centerPanel, rightPanel }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('anforderung');

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(TABS[(idx + 1) % TABS.length].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(TABS[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Mobile: Sidebar-Strip */}
      <div className="md:hidden shrink-0 border-b border-edge bg-surface">
        <Sidebar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop-Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-edge bg-surface overflow-hidden">
          <Sidebar />
        </div>

        {/* Hauptinhalt */}
        <main id="main-content" className="flex flex-col flex-1 overflow-hidden">
          {/* Desktop: drei Spalten */}
          <div className="hidden md:flex flex-1 overflow-hidden h-full">
            <div className="w-72 shrink-0 border-r border-edge bg-canvas overflow-hidden flex flex-col">
              {leftPanel}
            </div>
            <div className="flex-1 bg-canvas overflow-hidden flex flex-col">
              {centerPanel}
            </div>
            <div className="w-80 shrink-0 border-l border-edge bg-canvas overflow-hidden flex flex-col">
              {rightPanel}
            </div>
          </div>

          {/* Mobile: Tab-Navigation */}
          <div className="md:hidden flex flex-col flex-1 overflow-hidden">
            <div
              role="tablist"
              aria-label="Arbeitsbereiche"
              className="flex shrink-0 border-b border-edge bg-surface"
            >
              {TABS.map((tab, idx) => (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={[
                    'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                    activeTab === tab.id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-ink-secondary hover:text-ink hover:border-edge',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-canvas">
              <div role="tabpanel" id="panel-anforderung" aria-labelledby="tab-anforderung" hidden={activeTab !== 'anforderung'}>
                {leftPanel}
              </div>
              <div role="tabpanel" id="panel-story" aria-labelledby="tab-story" hidden={activeTab !== 'story'}>
                {centerPanel}
              </div>
              <div role="tabpanel" id="panel-refinement" aria-labelledby="tab-refinement" hidden={activeTab !== 'refinement'}>
                {rightPanel}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
