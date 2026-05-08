import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// AppShell bringt Sidebar (TanStack + Storage + Routing) mit — stub für Layout-Isolierung
vi.mock('../components/layout/AppShell', () => ({
  AppShell: ({ leftPanel, centerPanel, rightPanel }: { leftPanel: ReactNode; centerPanel: ReactNode; rightPanel: ReactNode }) => (
    <div data-testid="appshell">
      <div data-testid="left">{leftPanel}</div>
      <div data-testid="center">{centerPanel}</div>
      <div data-testid="right">{rightPanel}</div>
    </div>
  ),
}));

// Story-Panels haben eigene Sub-Hooks — stub für WorkspacePage-Isolation
vi.mock('../components/story-generator/StoryInputPanel', () => ({
  StoryInputPanel: () => <div data-testid="story-input-panel" />,
}));
vi.mock('../components/story-generator/StoryOutputPanel', () => ({
  StoryOutputPanel: () => <div data-testid="story-output-panel" />,
}));
vi.mock('../components/story-generator/InsightsPanel', () => ({
  InsightsPanel: () => <div data-testid="insights-panel" />,
}));

// useStory braucht localStorage + QueryClient
vi.mock('../hooks/useStory', () => ({
  useStory: () => ({ data: undefined, isLoading: false }),
}));

import { WorkspacePage } from './WorkspacePage';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/tools/story-generator']}>
        <Routes>
          <Route path="/tools/story-generator" element={children} />
          <Route path="/tools/story-generator/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WorkspacePage — Rendering', () => {
  it('rendert AppShell mit allen drei Panels', () => {
    render(<WorkspacePage />, { wrapper });
    expect(screen.getByTestId('appshell')).toBeInTheDocument();
    expect(screen.getByTestId('story-input-panel')).toBeInTheDocument();
    expect(screen.getByTestId('story-output-panel')).toBeInTheDocument();
    expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
  });
});
