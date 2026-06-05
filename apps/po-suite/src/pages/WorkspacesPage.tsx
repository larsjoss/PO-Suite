import { useState } from 'react';
import { useWorkspace } from '../shared/context/WorkspaceContext';
import { deleteWorkspace, listWorkspaces } from '../shared/services/workspaceService';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import type { Workspace } from '../shared/types/workspace';

const TOOL_LABELS: Record<string, string> = {
  story: 'Story',
  testcase: 'Testfälle',
  doc: 'Dokumentation',
  goal: 'Goal',
  polish: 'Text',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkspacesPage() {
  const { activeWorkspace, setActiveWorkspace, clearActiveWorkspace, refreshActiveWorkspace } =
    useWorkspace();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => listWorkspaces());
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = () => setWorkspaces(listWorkspaces());

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteWorkspace(deleteTarget.id);
    if (activeWorkspace?.id === deleteTarget.id) clearActiveWorkspace();
    setDeleteTarget(null);
    refresh();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div id="main-content" className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
      <h1 className="font-serif text-xl font-semibold text-ink mb-6">Workspaces</h1>

      {workspaces.length === 0 && (
        <p className="text-sm text-ink-secondary">Noch keine Workspaces vorhanden.</p>
      )}

      <ul className="space-y-3">
        {workspaces.map((ws) => (
          <li key={ws.id} className="border border-edge rounded-lg bg-surface overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {activeWorkspace?.id === ws.id && (
                    <span className="text-brand text-xs shrink-0" aria-label="Aktiver Workspace">◉</span>
                  )}
                  <span className="font-medium text-sm text-ink truncate">{ws.name}</span>
                </div>
                <div className="text-xs text-ink-tertiary mt-0.5">
                  {formatDate(ws.updatedAt)} · {ws.artifacts.length} Artefakt{ws.artifacts.length !== 1 ? 'e' : ''}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeWorkspace?.id === ws.id ? (
                  <button
                    type="button"
                    onClick={clearActiveWorkspace}
                    className="text-xs text-ink-secondary hover:text-ink px-2 py-1 rounded border border-edge hover:border-ink-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                  >
                    Deaktivieren
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setActiveWorkspace(ws.id); refreshActiveWorkspace(); }}
                    className="text-xs text-brand hover:underline px-2 py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
                  >
                    Aktivieren
                  </button>
                )}

                {ws.artifacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(ws.id)}
                    aria-expanded={expanded.has(ws.id)}
                    aria-label={expanded.has(ws.id) ? 'Artefakte ausblenden' : 'Artefakte einblenden'}
                    className="text-xs text-ink-secondary hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded px-1"
                  >
                    {expanded.has(ws.id) ? '▲' : '▼'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteTarget(ws)}
                  aria-label={`Workspace ${ws.name} löschen`}
                  className="text-xs text-red-500 hover:text-red-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded px-2 py-1"
                >
                  Löschen
                </button>
              </div>
            </div>

            {expanded.has(ws.id) && ws.artifacts.length > 0 && (
              <ul className="border-t border-edge divide-y divide-edge bg-canvas">
                {ws.artifacts.map((art) => (
                  <li key={art.id} className="px-4 py-2 text-xs flex items-center gap-2">
                    <span className="shrink-0 text-ink-tertiary">[{TOOL_LABELS[art.toolId] ?? art.toolId}]</span>
                    <span className="text-ink truncate">{art.title}</span>
                    <span className="text-ink-tertiary ml-auto shrink-0">{formatDate(art.generatedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Workspace löschen"
        message={deleteTarget ? `«${deleteTarget.name}» und alle ${deleteTarget.artifacts.length} Artefakte werden unwiderruflich gelöscht.` : ''}
        confirmLabel="Löschen"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
