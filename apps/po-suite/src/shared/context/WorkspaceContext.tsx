import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { ACTIVE_WORKSPACE_KEY } from '../services/storageKeys';
import {
  addArtifact,
  getWorkspace,
  updateWorkspaceContext,
} from '../services/workspaceService';
import type { Workspace, WorkspaceArtifact } from '../types/workspace';

type WorkspaceContextValue = {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (id: string) => void;
  clearActiveWorkspace: () => void;
  addArtifactToActive: (artifact: WorkspaceArtifact) => void;
  updateContextOfActive: (context: string) => void;
  refreshActiveWorkspace: () => void;
};

const noopWorkspace: WorkspaceContextValue = {
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  clearActiveWorkspace: () => {},
  addArtifactToActive: () => {},
  updateContextOfActive: () => {},
  refreshActiveWorkspace: () => {},
};

const WorkspaceContext = createContext<WorkspaceContextValue>(noopWorkspace);

function loadFromSession(): Workspace | null {
  const id = sessionStorage.getItem(ACTIVE_WORKSPACE_KEY);
  if (!id) return null;
  return getWorkspace(id);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(loadFromSession);

  const setActiveWorkspace = useCallback((id: string) => {
    sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    setActiveWorkspaceState(getWorkspace(id));
  }, []);

  const clearActiveWorkspace = useCallback(() => {
    sessionStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    setActiveWorkspaceState(null);
  }, []);

  const refreshActiveWorkspace = useCallback(() => {
    const id = sessionStorage.getItem(ACTIVE_WORKSPACE_KEY);
    setActiveWorkspaceState(id ? getWorkspace(id) : null);
  }, []);

  const addArtifactToActive = useCallback(
    (artifact: WorkspaceArtifact) => {
      if (!activeWorkspace) return;
      addArtifact(activeWorkspace.id, artifact);
      refreshActiveWorkspace();
    },
    [activeWorkspace, refreshActiveWorkspace],
  );

  const updateContextOfActive = useCallback(
    (context: string) => {
      if (!activeWorkspace) return;
      updateWorkspaceContext(activeWorkspace.id, context);
      refreshActiveWorkspace();
    },
    [activeWorkspace, refreshActiveWorkspace],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        clearActiveWorkspace,
        addArtifactToActive,
        updateContextOfActive,
        refreshActiveWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}
