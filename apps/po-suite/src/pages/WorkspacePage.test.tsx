import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Sub-components have their own hooks — stub for page-level isolation
vi.mock('../components/sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));
vi.mock('../components/story-generator/StoryInputPanel', () => ({
  StoryInputPanel: () => <div data-testid="story-input-panel" />,
}));
vi.mock('../components/story-generator/StoryOutputPanel', () => ({
  StoryOutputPanel: () => <div data-testid="story-output-panel" />,
}));
vi.mock('../components/story-generator/InsightsPanel', () => ({
  InsightsPanel: () => <div data-testid="insights-panel" />,
}));
vi.mock('../hooks/useStory', () => ({
  useStory: () => ({ data: undefined, isLoading: false }),
}));

import { WorkspacePage } from './WorkspacePage';

function makeWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/tools/story-generator" element={children} />
            <Route path="/tools/story-generator/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('WorkspacePage — Input-Screen (kein ID)', () => {
  it('zeigt Sidebar und StoryInputPanel', () => {
    render(<WorkspacePage />, { wrapper: makeWrapper('/tools/story-generator') });
    expect(screen.getAllByTestId('sidebar').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('story-input-panel').length).toBeGreaterThan(0);
  });

  it('zeigt keinen Output-Panel auf Input-Screen', () => {
    render(<WorkspacePage />, { wrapper: makeWrapper('/tools/story-generator') });
    // On desktop (no id), output panel hidden inside tabpanel (hidden attr)
    const outputPanels = screen.getAllByTestId('story-output-panel');
    outputPanels.forEach((el) => {
      // Only visible inside hidden mobile tabpanel — not in the main desktop area
      expect(el.closest('[hidden]')).not.toBeNull();
    });
  });
});

describe('WorkspacePage — Output-Screen (mit ID)', () => {
  it('zeigt Sidebar, StoryOutputPanel und InsightsPanel', () => {
    render(<WorkspacePage />, { wrapper: makeWrapper('/tools/story-generator/story-123') });
    expect(screen.getAllByTestId('sidebar').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('story-output-panel').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('insights-panel').length).toBeGreaterThan(0);
  });
});
