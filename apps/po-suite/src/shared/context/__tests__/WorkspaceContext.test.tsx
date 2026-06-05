import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';
import { ACTIVE_WORKSPACE_KEY } from '../../services/storageKeys';
import { createWorkspace } from '../../services/workspaceService';
import type { WorkspaceArtifact } from '../../types/workspace';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <WorkspaceProvider>{children}</WorkspaceProvider>
);

function makeArtifact(): WorkspaceArtifact {
  return {
    id: 'art-1',
    toolId: 'story',
    generatedAt: Date.now(),
    title: 'Test',
    content: 'Content',
  };
}

describe('WorkspaceProvider + useWorkspace', () => {
  it('starts with null active workspace', () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.activeWorkspace).toBeNull();
  });

  it('setActiveWorkspace persists to sessionStorage and updates state', () => {
    const ws = createWorkspace('WS');
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    act(() => {
      result.current.setActiveWorkspace(ws.id);
    });
    expect(result.current.activeWorkspace?.id).toBe(ws.id);
    expect(sessionStorage.getItem(ACTIVE_WORKSPACE_KEY)).toBe(ws.id);
  });

  it('clearActiveWorkspace removes sessionStorage and sets null', () => {
    const ws = createWorkspace('WS');
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    act(() => {
      result.current.setActiveWorkspace(ws.id);
    });
    act(() => {
      result.current.clearActiveWorkspace();
    });
    expect(result.current.activeWorkspace).toBeNull();
    expect(sessionStorage.getItem(ACTIVE_WORKSPACE_KEY)).toBeNull();
  });

  it('addArtifactToActive adds artifact to workspace', () => {
    const ws = createWorkspace('WS');
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    act(() => {
      result.current.setActiveWorkspace(ws.id);
    });
    act(() => {
      result.current.addArtifactToActive(makeArtifact());
    });
    expect(result.current.activeWorkspace?.artifacts).toHaveLength(1);
  });

  it('updateContextOfActive updates context in active workspace', () => {
    const ws = createWorkspace('WS', 'alt');
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    act(() => {
      result.current.setActiveWorkspace(ws.id);
    });
    act(() => {
      result.current.updateContextOfActive('neu');
    });
    expect(result.current.activeWorkspace?.workspaceContext).toBe('neu');
  });

  it('restores active workspace from sessionStorage on mount', () => {
    const ws = createWorkspace('WS');
    sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, ws.id);
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.activeWorkspace?.id).toBe(ws.id);
  });
});
