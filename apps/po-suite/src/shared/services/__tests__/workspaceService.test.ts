import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspaceContext,
  addArtifact,
  deleteWorkspace,
} from '../workspaceService';
import { WORKSPACE_INDEX_KEY, WORKSPACE_ITEM_PREFIX } from '../storageKeys';
import type { WorkspaceArtifact } from '../../types/workspace';

afterEach(() => {
  localStorage.clear();
});

function makeArtifact(overrides: Partial<WorkspaceArtifact> = {}): WorkspaceArtifact {
  return {
    id: crypto.randomUUID(),
    toolId: 'story',
    generatedAt: Date.now(),
    title: 'Test Artefakt',
    content: 'Inhalt',
    ...overrides,
  };
}

describe('createWorkspace', () => {
  it('creates workspace with correct fields', () => {
    const ws = createWorkspace('Mein Workspace', 'Kontext hier');
    expect(ws.name).toBe('Mein Workspace');
    expect(ws.workspaceContext).toBe('Kontext hier');
    expect(ws.artifacts).toEqual([]);
    expect(typeof ws.id).toBe('string');
    expect(ws.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('stores workspace in localStorage and index', () => {
    const ws = createWorkspace('WS1');
    const index = JSON.parse(localStorage.getItem(WORKSPACE_INDEX_KEY)!);
    expect(index).toContain(ws.id);
    expect(localStorage.getItem(WORKSPACE_ITEM_PREFIX + ws.id)).not.toBeNull();
  });

  it('trims name to 80 characters', () => {
    const ws = createWorkspace('x'.repeat(100));
    expect(ws.name).toHaveLength(80);
  });

  it('trims context to 500 characters', () => {
    const ws = createWorkspace('N', 'c'.repeat(600));
    expect(ws.workspaceContext).toHaveLength(500);
  });
});

describe('getWorkspace', () => {
  it('returns null for unknown id', () => {
    expect(getWorkspace('nonexistent')).toBeNull();
  });

  it('returns workspace for known id', () => {
    const ws = createWorkspace('WS');
    expect(getWorkspace(ws.id)).toMatchObject({ id: ws.id, name: 'WS' });
  });
});

describe('listWorkspaces', () => {
  it('returns empty array when none exist', () => {
    expect(listWorkspaces()).toEqual([]);
  });

  it('returns workspaces sorted by updatedAt desc', async () => {
    const ws1 = createWorkspace('Older');
    await new Promise((r) => setTimeout(r, 5));
    const ws2 = createWorkspace('Newer');
    const list = listWorkspaces();
    expect(list[0].id).toBe(ws2.id);
    expect(list[1].id).toBe(ws1.id);
  });
});

describe('updateWorkspaceContext', () => {
  it('updates context and touches updatedAt', async () => {
    const ws = createWorkspace('WS', 'Alt');
    const before = ws.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    updateWorkspaceContext(ws.id, 'Neu');
    const updated = getWorkspace(ws.id)!;
    expect(updated.workspaceContext).toBe('Neu');
    expect(updated.updatedAt).toBeGreaterThan(before);
  });

  it('is a no-op for unknown id', () => {
    expect(() => updateWorkspaceContext('ghost', 'x')).not.toThrow();
  });
});

describe('addArtifact', () => {
  it('appends artifact and touches updatedAt', async () => {
    const ws = createWorkspace('WS');
    const before = ws.updatedAt;
    const artifact = makeArtifact();
    await new Promise((r) => setTimeout(r, 5));
    addArtifact(ws.id, artifact);
    const updated = getWorkspace(ws.id)!;
    expect(updated.artifacts).toHaveLength(1);
    expect(updated.artifacts[0].id).toBe(artifact.id);
    expect(updated.updatedAt).toBeGreaterThan(before);
  });
});

describe('deleteWorkspace', () => {
  it('removes workspace from index and localStorage', () => {
    const ws = createWorkspace('WS');
    deleteWorkspace(ws.id);
    expect(getWorkspace(ws.id)).toBeNull();
    const index = JSON.parse(localStorage.getItem(WORKSPACE_INDEX_KEY)!);
    expect(index).not.toContain(ws.id);
  });

  it('is a no-op for unknown id', () => {
    expect(() => deleteWorkspace('ghost')).not.toThrow();
  });
});

describe('overflow — max 10 workspaces', () => {
  it('deletes the oldest workspace when 11th is created', async () => {
    vi.useFakeTimers();
    const created: string[] = [];
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(10);
      created.push(createWorkspace(`WS ${i}`).id);
    }
    // The oldest one is created[0]
    vi.advanceTimersByTime(10);
    const eleventh = createWorkspace('WS 10');
    const allIds = listWorkspaces().map((ws) => ws.id);
    expect(allIds).not.toContain(created[0]);
    expect(allIds).toContain(eleventh.id);
    expect(allIds).toHaveLength(10);
    vi.useRealTimers();
  });
});
