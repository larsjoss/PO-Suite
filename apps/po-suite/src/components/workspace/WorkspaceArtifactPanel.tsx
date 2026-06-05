import { useState } from 'react';
import { useWorkspace } from '../../shared/context/WorkspaceContext';

const TOOL_LABELS: Record<string, string> = {
  story: 'Story',
  testcase: 'Testfälle',
  doc: 'Doku',
  goal: 'Goal',
  polish: 'Text',
};

interface Props {
  onAppend: (content: string) => void;
}

export function WorkspaceArtifactPanel({ onAppend }: Props) {
  const { activeWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  const artifacts = activeWorkspace?.artifacts ?? [];
  if (artifacts.length === 0) return null;

  return (
    <div className="border border-edge rounded-lg bg-canvas overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-ink-secondary hover:text-ink hover:bg-edge-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors"
      >
        <span>Artefakte in diesem Workspace ({artifacts.length})</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="border-t border-edge divide-y divide-edge" role="list">
          {artifacts.map((art) => (
            <li key={art.id}>
              <button
                type="button"
                onClick={() => onAppend(`\n\n---\n\n${art.content}`)}
                className="w-full text-left px-3 py-2 hover:bg-edge-2 focus:outline-none focus-visible:bg-edge-2 transition-colors flex items-center gap-2"
                title="Klicken um Artefakt an Eingabe anzufügen"
              >
                <span className="shrink-0 text-xs text-ink-tertiary font-medium">
                  [{TOOL_LABELS[art.toolId] ?? art.toolId}]
                </span>
                <span className="text-xs text-ink truncate">{art.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
