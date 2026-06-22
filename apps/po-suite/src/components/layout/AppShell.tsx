import { useState } from 'react';
import type { ReactNode } from 'react';
import { TabBar } from '../../shared/components';
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

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Mobile: Sidebar-Strip */}
      <div className="md:hidden shrink-0 border-b border-edge bg-surface">
        <Sidebar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop-Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-72 shrink-0 border-r border-edge bg-surface overflow-hidden">
          <Sidebar />
        </div>

        {/* Hauptinhalt */}
        <main id="main-content" className="flex flex-col flex-1 overflow-hidden">
          {/* Desktop: drei Spalten */}
          <div className="hidden md:flex flex-1 overflow-hidden h-full">
            <div className="w-64 shrink-0 border-r border-edge bg-canvas overflow-hidden flex flex-col">
              {leftPanel}
            </div>
            <div className="flex-1 bg-canvas overflow-hidden flex flex-col">
              {centerPanel}
            </div>
            <div className="w-96 shrink-0 border-l border-edge bg-canvas overflow-hidden flex flex-col">
              {rightPanel}
            </div>
          </div>

          {/* Mobile: Tab-Navigation */}
          <div className="md:hidden flex flex-col flex-1 overflow-hidden">
            <TabBar
              tabs={TABS}
              value={activeTab}
              onChange={setActiveTab}
              aria-label="Arbeitsbereiche"
              className="shrink-0 bg-surface"
            />

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
