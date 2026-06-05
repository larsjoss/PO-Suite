import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { WorkspaceSelector } from '../WorkspaceSelector';
import { WorkspaceProvider } from '../../../shared/context/WorkspaceContext';
import { createWorkspace } from '../../../shared/services/workspaceService';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <WorkspaceProvider>{children}</WorkspaceProvider>
);

describe('WorkspaceSelector', () => {
  it('renders "+ Neuer Workspace" when no workspaces exist', () => {
    render(<WorkspaceSelector />, { wrapper });
    expect(screen.getByText('+ Neuer Workspace')).toBeInTheDocument();
  });

  it('shows "Kein Workspace aktiv" when workspaces exist but none is active', () => {
    createWorkspace('WS 1');
    render(<WorkspaceSelector />, { wrapper });
    expect(screen.getByText('Kein Workspace aktiv')).toBeInTheDocument();
  });

  it('shows inline form after clicking "+ Neuer Workspace"', async () => {
    render(<WorkspaceSelector />, { wrapper });
    fireEvent.click(screen.getByText('+ Neuer Workspace'));
    await waitFor(() =>
      expect(screen.getByLabelText('Name *')).toBeInTheDocument(),
    );
  });

  it('creates workspace and shows it as active', async () => {
    render(<WorkspaceSelector />, { wrapper });
    fireEvent.click(screen.getByText('+ Neuer Workspace'));
    const nameInput = await screen.findByLabelText('Name *');
    fireEvent.change(nameInput, { target: { value: 'Sprint 42' } });
    fireEvent.submit(nameInput.closest('form')!);
    await waitFor(() =>
      expect(screen.getByText('Sprint 42')).toBeInTheDocument(),
    );
    expect(screen.getByText('◉')).toBeInTheDocument();
  });

  it('opens dropdown on "▾ Wechseln" click', async () => {
    const ws = createWorkspace('WS 1');
    sessionStorage.setItem('po_active_workspace', ws.id);
    render(<WorkspaceSelector />, { wrapper });
    const switchBtn = screen.getByRole('button', { name: 'Workspace wechseln' });
    fireEvent.click(switchBtn);
    await waitFor(() =>
      expect(screen.getByText('+ Neuer Workspace')).toBeInTheDocument(),
    );
  });

  it('clears active workspace on ✕ click', async () => {
    const ws = createWorkspace('WS 1');
    sessionStorage.setItem('po_active_workspace', ws.id);
    render(<WorkspaceSelector />, { wrapper });
    const clearBtn = screen.getByRole('button', { name: 'Workspace deaktivieren' });
    fireEvent.click(clearBtn);
    await waitFor(() =>
      expect(screen.getByText('Kein Workspace aktiv')).toBeInTheDocument(),
    );
  });

  it('cancel button in new-form hides the form', async () => {
    render(<WorkspaceSelector />, { wrapper });
    fireEvent.click(screen.getByText('+ Neuer Workspace'));
    await screen.findByLabelText('Name *');
    fireEvent.click(screen.getByText('Abbrechen'));
    await waitFor(() =>
      expect(screen.queryByLabelText('Name *')).not.toBeInTheDocument(),
    );
  });
});
