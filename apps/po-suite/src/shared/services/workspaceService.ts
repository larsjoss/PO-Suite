import { WORKSPACE_INDEX_KEY, WORKSPACE_ITEM_PREFIX } from './storageKeys';
import type { Workspace, WorkspaceArtifact } from '../types/workspace';

const MAX_WORKSPACES = 10;
const MAX_NAME_LENGTH = 80;
const MAX_CONTEXT_LENGTH = 500;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(WORKSPACE_INDEX_KEY, JSON.stringify(ids));
}

function readWorkspace(id: string): Workspace | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_ITEM_PREFIX + id);
    return raw ? (JSON.parse(raw) as Workspace) : null;
  } catch {
    return null;
  }
}

function writeWorkspace(ws: Workspace): void {
  localStorage.setItem(WORKSPACE_ITEM_PREFIX + ws.id, JSON.stringify(ws));
}

export function createWorkspace(name: string, workspaceContext = ''): Workspace {
  const index = readIndex();

  if (index.length >= MAX_WORKSPACES) {
    // Delete the oldest by updatedAt
    const all = index.map((id) => readWorkspace(id)).filter((ws): ws is Workspace => ws !== null);
    all.sort((a, b) => a.updatedAt - b.updatedAt);
    const oldest = all[0];
    if (oldest) deleteWorkspace(oldest.id);
  }

  const now = Date.now();
  const ws: Workspace = {
    id: crypto.randomUUID(),
    name: name.slice(0, MAX_NAME_LENGTH),
    workspaceContext: workspaceContext.slice(0, MAX_CONTEXT_LENGTH),
    artifacts: [],
    createdAt: now,
    updatedAt: now,
  };

  writeWorkspace(ws);
  const newIndex = readIndex();
  writeIndex([...newIndex, ws.id]);
  return ws;
}

export function getWorkspace(id: string): Workspace | null {
  return readWorkspace(id);
}

export function listWorkspaces(): Workspace[] {
  const index = readIndex();
  const workspaces = index
    .map((id) => readWorkspace(id))
    .filter((ws): ws is Workspace => ws !== null);
  return workspaces.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function updateWorkspaceContext(id: string, workspaceContext: string): void {
  const ws = readWorkspace(id);
  if (!ws) return;
  const updated: Workspace = {
    ...ws,
    workspaceContext: workspaceContext.slice(0, MAX_CONTEXT_LENGTH),
    updatedAt: Date.now(),
  };
  writeWorkspace(updated);
}

export function addArtifact(workspaceId: string, artifact: WorkspaceArtifact): void {
  const ws = readWorkspace(workspaceId);
  if (!ws) return;
  const updated: Workspace = {
    ...ws,
    artifacts: [...ws.artifacts, artifact],
    updatedAt: Date.now(),
  };
  writeWorkspace(updated);
}

export function deleteWorkspace(id: string): void {
  const index = readIndex();
  writeIndex(index.filter((i) => i !== id));
  localStorage.removeItem(WORKSPACE_ITEM_PREFIX + id);
}
