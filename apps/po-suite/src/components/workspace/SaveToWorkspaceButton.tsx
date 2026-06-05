import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../../shared/context/WorkspaceContext';
import { addArtifact, createWorkspace, listWorkspaces } from '../../shared/services/workspaceService';
import type { WorkspaceArtifact, WorkspaceToolId } from '../../shared/types/workspace';

interface Props {
  toolId: WorkspaceToolId;
  title: string;
  content: string;
}

export function SaveToWorkspaceButton({ toolId, title, content }: Props) {
  const { activeWorkspace, addArtifactToActive, setActiveWorkspace } = useWorkspace();
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [workspaces, setWorkspaces] = useState(() => listWorkspaces());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    setWorkspaces(listWorkspaces());
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const buildArtifact = (): WorkspaceArtifact => ({
    id: crypto.randomUUID(),
    toolId,
    generatedAt: Date.now(),
    title: title.slice(0, 200),
    content,
  });

  const handleSave = () => {
    if (!activeWorkspace) {
      setShowPicker(true);
      return;
    }
    addArtifactToActive(buildArtifact());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveToWorkspace = (id: string) => {
    addArtifact(id, buildArtifact());
    setActiveWorkspace(id);
    setShowPicker(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCreateAndSave = () => {
    const name = prompt('Workspace-Name (max. 80 Zeichen):');
    if (!name?.trim()) return;
    const ws = createWorkspace(name.trim());
    handleSaveToWorkspace(ws.id);
  };

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-light text-green-700 border border-brand/20 cursor-default"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {activeWorkspace ? `In «${activeWorkspace.name}» gespeichert` : 'Gespeichert'}
      </button>
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={handleSave}
        aria-label="Artefakt in Workspace speichern"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-edge hover:text-ink hover:border-ink-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        {activeWorkspace ? `In Workspace speichern` : 'In Workspace speichern'}
      </button>

      {showPicker && !activeWorkspace && (
        <div className="absolute bottom-full mb-1 left-0 z-30 bg-surface border border-edge rounded-lg shadow-lg min-w-48 py-1">
          {workspaces.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-secondary">Keine Workspaces vorhanden</p>
          ) : (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSaveToWorkspace(ws.id)}
                className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-edge-2 focus:outline-none focus-visible:bg-edge-2 transition-colors truncate"
              >
                {ws.name}
              </button>
            ))
          )}
          <div className="border-t border-edge mt-1 pt-1">
            <button
              type="button"
              onClick={handleCreateAndSave}
              className="w-full text-left px-3 py-2 text-xs text-brand hover:bg-edge-2 focus:outline-none transition-colors"
            >
              + Neuen Workspace erstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
