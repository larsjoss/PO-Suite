import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Sidebar zieht TanStack Query, Storage und Routing nach — fuer den
// AppShell-Layout-Test ist das Overhead. Stub die Sidebar.
vi.mock('../sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar-stub" />,
}));

import { AppShell } from './AppShell';

function setup() {
  return render(
    <MemoryRouter>
      <AppShell
        leftPanel={<div>Anforderung-Panel</div>}
        centerPanel={<div>Story-Panel</div>}
        rightPanel={<div>Refinement-Panel</div>}
      />
    </MemoryRouter>,
  );
}

describe('AppShell — Tab-Rendering (Mobile)', () => {
  it('rendert tablist mit aria-label', () => {
    setup();
    expect(
      screen.getByRole('tablist', { name: /Arbeitsbereiche/i }),
    ).toBeInTheDocument();
  });

  it('rendert drei Tabs', () => {
    setup();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('startet mit "Anforderung" als aktivem Tab', () => {
    setup();
    const anf = screen.getByRole('tab', { name: 'Anforderung' });
    expect(anf).toHaveAttribute('aria-selected', 'true');
    expect(anf).toHaveAttribute('tabIndex', '0');
  });

  it('inaktive Tabs haben tabIndex=-1', () => {
    setup();
    const story = screen.getByRole('tab', { name: 'Story' });
    expect(story).toHaveAttribute('aria-selected', 'false');
    expect(story).toHaveAttribute('tabIndex', '-1');
  });

  it('Klick auf Tab aktiviert ihn', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Refinement' }));
    expect(screen.getByRole('tab', { name: 'Refinement' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('AppShell — Keyboard-Navigation', () => {
  it('ArrowRight wandert vorwärts', () => {
    setup();
    const anf = screen.getByRole('tab', { name: 'Anforderung' });
    fireEvent.keyDown(anf, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Story' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('ArrowRight wraps von letztem zum ersten', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Refinement' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Refinement' }), {
      key: 'ArrowRight',
    });
    expect(screen.getByRole('tab', { name: 'Anforderung' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('ArrowLeft wandert rückwärts', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Story' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Story' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Anforderung' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('ArrowLeft wraps von erstem zum letzten', () => {
    setup();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Anforderung' }), {
      key: 'ArrowLeft',
    });
    expect(screen.getByRole('tab', { name: 'Refinement' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('Home springt zum ersten Tab', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Refinement' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Refinement' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Anforderung' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('End springt zum letzten Tab', () => {
    setup();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Anforderung' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Refinement' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('AppShell — Tabpanels', () => {
  it('rendert tabpanel mit aria-labelledby Verknüpfung', () => {
    setup();
    // Mobile-Panels haben role=tabpanel, sind aber per default hidden außer aktiv
    const anfPanel = document.getElementById('panel-anforderung');
    expect(anfPanel).toHaveAttribute('aria-labelledby', 'tab-anforderung');
  });

  it('aktives Panel ist nicht hidden', () => {
    setup();
    const anfPanel = document.getElementById('panel-anforderung');
    expect(anfPanel).not.toHaveAttribute('hidden');
  });

  it('inaktives Panel ist hidden', () => {
    setup();
    const storyPanel = document.getElementById('panel-story');
    expect(storyPanel).toHaveAttribute('hidden');
  });
});
