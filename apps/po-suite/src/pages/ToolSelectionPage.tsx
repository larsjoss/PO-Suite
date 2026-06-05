import { useState } from 'react';
import { TOOLS } from '../constants/tools';
import { ToolTile } from '../components/home/ToolTile';
import { ArsenalCelebration } from '../components/home/ArsenalCelebration';
import { LAST_USED_TOOL_KEY, LAST_USED_AT_KEY } from '../shared/services/storageKeys';

const TTL_MS = 24 * 60 * 60 * 1000;

function readLastUsedToolId(): string | null {
  const id = localStorage.getItem(LAST_USED_TOOL_KEY);
  const at = Number(localStorage.getItem(LAST_USED_AT_KEY) ?? '0');
  if (!id || Date.now() - at > TTL_MS) return null;
  return id;
}

export function ToolSelectionPage() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const lastUsedToolId = readLastUsedToolId();

  return (
    <main
      id="main-content"
      className="relative flex-1 overflow-auto bg-canvas"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-semibold text-ink mb-1">
            Welches Tool brauchst du?
          </h1>
          <p className="text-sm text-ink-secondary">
            Wähle ein Tool, um loszulegen.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {TOOLS.map((tool) => (
            <ToolTile key={tool.id} tool={tool} isLastUsed={tool.id === lastUsedToolId} />
          ))}
        </div>
      </div>

      {/* Easter Egg Button */}
      <button
        className="absolute bottom-4 right-4 text-base leading-none opacity-20 hover:opacity-60 transition-opacity focus-visible:opacity-60 focus-visible:ring-2 focus-visible:ring-ink/30 rounded"
        title="AFC"
        aria-label="AFC"
        onClick={() => setShowEasterEgg(true)}
      >
        🔴
      </button>

      {showEasterEgg && (
        <ArsenalCelebration onClose={() => setShowEasterEgg(false)} />
      )}
    </main>
  );
}
