import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useWorkspace } from '../../shared/context/WorkspaceContext';
import { createWorkspace, listWorkspaces } from '../../shared/services/workspaceService';
import type { Workspace } from '../../shared/types/workspace';

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.floor(hours / 24)} T`;
}

type View = 'banner' | 'dropdown' | 'new-form';

export function WorkspaceSelector() {
  const { activeWorkspace, setActiveWorkspace, clearActiveWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => listWorkspaces());
  const [view, setView] = useState<View>('banner');
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [, forceUpdate] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setWorkspaces(listWorkspaces());
    forceUpdate((n) => n + 1);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (view !== 'dropdown') return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setView('banner');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [view]);

  // Focus name input when form opens
  useEffect(() => {
    if (view === 'new-form') {
      nameInputRef.current?.focus();
    }
  }, [view]);

  if (workspaces.length === 0 && !activeWorkspace && view === 'banner') {
    return (
      <div className="shrink-0 bg-surface border-b border-edge px-4 py-1.5 flex items-center gap-2 text-xs text-ink-secondary">
        <button
          type="button"
          onClick={() => { refresh(); setView('new-form'); }}
          className="text-brand hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
        >
          + Neuer Workspace
        </button>
      </div>
    );
  }

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ws = createWorkspace(name.trim(), context.trim());
    setActiveWorkspace(ws.id);
    refresh();
    setName('');
    setContext('');
    setView('banner');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setView('banner');
      setName('');
      setContext('');
    }
  };

  const handleSwitch = (id: string) => {
    setActiveWorkspace(id);
    refresh();
    setView('banner');
  };

  if (view === 'new-form') {
    return (
      <div className="shrink-0 bg-surface border-b border-edge px-4 py-2">
        <form onSubmit={handleCreate} onKeyDown={handleKeyDown} className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2">
            <label htmlFor="ws-name" className="text-xs text-ink-secondary shrink-0 w-20">
              Name *
            </label>
            <input
              id="ws-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              maxLength={80}
              required
              placeholder="Workspace-Name"
              className="flex-1 text-xs border border-edge rounded px-2 py-1 bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-xs text-ink-tertiary shrink-0">{name.length}/80</span>
          </div>
          <div className="flex items-start gap-2">
            <label htmlFor="ws-context" className="text-xs text-ink-secondary shrink-0 w-20 mt-1">
              Kontext
            </label>
            <div className="flex-1">
              <textarea
                id="ws-context"
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, 500))}
                maxLength={500}
                rows={2}
                placeholder="Ausgangslage / Feature-Beschreibung"
                className="w-full text-xs border border-edge rounded px-2 py-1 bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <p className="text-xs text-ink-tertiary mt-0.5">
                Dieser Kontext wird automatisch an alle Tools in diesem Workspace weitergegeben — du gibst ihn nur einmal ein.
                <span className="ml-2">{context.length}/500</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-[88px]">
            <button
              type="submit"
              disabled={!name.trim()}
              className="text-xs bg-brand text-white px-3 py-1 rounded hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => { setView('banner'); setName(''); setContext(''); }}
              className="text-xs text-ink-secondary hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded px-2 py-1"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (view === 'dropdown') {
    return (
      <div className="shrink-0 bg-surface border-b border-edge relative" ref={dropdownRef}>
        <div className="absolute top-0 left-0 z-30 bg-surface border border-edge rounded-b shadow-lg min-w-56 py-1">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => handleSwitch(ws.id)}
              className={[
                'w-full text-left px-3 py-2 text-xs hover:bg-edge-2 focus:outline-none focus-visible:bg-edge-2 transition-colors',
                activeWorkspace?.id === ws.id ? 'text-brand font-semibold' : 'text-ink',
              ].join(' ')}
            >
              <span className="block truncate">{ws.name}</span>
              <span className="text-ink-tertiary font-normal">{formatRelativeTime(ws.updatedAt)}</span>
            </button>
          ))}
          <div className="border-t border-edge mt-1 pt-1">
            <button
              type="button"
              onClick={() => { setView('new-form'); }}
              className="w-full text-left px-3 py-2 text-xs text-brand hover:bg-edge-2 focus:outline-none focus-visible:bg-edge-2 transition-colors"
            >
              + Neuer Workspace
            </button>
          </div>
        </div>
        {/* Invisible spacer to keep layout height */}
        <div className="h-8" />
      </div>
    );
  }

  // banner view
  return (
    <div className="shrink-0 bg-surface border-b border-edge px-4 py-1.5 flex items-center gap-2 text-xs">
      {activeWorkspace ? (
        <>
          <span className="text-brand shrink-0" aria-hidden="true">◉</span>
          <span className="font-medium text-ink truncate max-w-xs">{activeWorkspace.name}</span>
          <span className="text-ink-tertiary shrink-0">
            · {formatRelativeTime(activeWorkspace.updatedAt)}
          </span>
          <button
            type="button"
            onClick={() => { refresh(); setView('dropdown'); }}
            aria-label="Workspace wechseln"
            className="text-ink-secondary hover:text-ink px-1.5 py-0.5 rounded border border-edge hover:border-edge focus:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors shrink-0"
          >
            ▾ Wechseln
          </button>
          <button
            type="button"
            onClick={clearActiveWorkspace}
            aria-label="Workspace deaktivieren"
            className="text-ink-tertiary hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded shrink-0"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span className="text-ink-secondary">Kein Workspace aktiv</span>
          <span className="text-edge" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => { refresh(); setView('dropdown'); }}
            aria-label="Workspace auswählen"
            className="text-brand hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
          >
            ▾ Wählen
          </button>
          <button
            type="button"
            onClick={() => { refresh(); setView('new-form'); }}
            className="text-brand hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
          >
            + Neuer Workspace
          </button>
        </>
      )}
    </div>
  );
}
