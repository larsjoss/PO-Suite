import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToolSelectionPage } from './ToolSelectionPage';
import { TOOLS } from '../constants/tools';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ToolSelectionPage />
    </MemoryRouter>,
  );
}

describe('ToolSelectionPage — Rendering', () => {
  it('zeigt Überschrift', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Welches Tool brauchst du/i })).toBeInTheDocument();
  });

  it('rendert alle Tools als Buttons', () => {
    renderPage();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(TOOLS.length);
  });

  it('zeigt alle Tool-Titel', () => {
    renderPage();
    for (const tool of TOOLS) {
      expect(screen.getByText(tool.title)).toBeInTheDocument();
    }
  });
});

describe('ToolSelectionPage — Navigation', () => {
  it('navigiert bei Tool-Klick zur Tool-Route', async () => {
    const user = userEvent.setup();
    renderPage();

    const firstTool = TOOLS[0];
    await user.click(screen.getByText(firstTool.title).closest('button')!);

    expect(navigateMock).toHaveBeenCalledWith(firstTool.path);
  });
});
