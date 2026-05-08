import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocGeneratorOutputPanel } from './DocGeneratorOutputPanel';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeTextMock.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    writable: true,
    configurable: true,
  });
});

interface SetupOverrides {
  markdown?: string;
  isLoading?: boolean;
  error?: Error | null;
}

function setup(overrides: SetupOverrides = {}) {
  const handlers = {
    onRegenerate: vi.fn(),
    onReset: vi.fn(),
  };
  const props = {
    markdown: '',
    isLoading: false,
    error: null,
    ...overrides,
  };
  render(
    <DocGeneratorOutputPanel
      {...props}
      onRegenerate={handlers.onRegenerate}
      onReset={handlers.onReset}
      contentRef={createRef<HTMLDivElement>()}
    />,
  );
  return handlers;
}

describe('DocGeneratorOutputPanel — Loading-Zustand', () => {
  it('zeigt Loading-Hinweis und Skeleton', () => {
    setup({ isLoading: true });
    expect(screen.getByText(/Dokumentation wird generiert/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('blendet Markdown im Loading-Zustand aus', () => {
    setup({ isLoading: true, markdown: '# Headline' });
    expect(screen.queryByRole('button', { name: /kopier/i })).not.toBeInTheDocument();
  });
});

describe('DocGeneratorOutputPanel — Output-Zustand', () => {
  it('rendert Markdown-Output', () => {
    setup({ markdown: '# Mein Titel\n\nMein Text.' });
    expect(screen.getByText('Mein Titel')).toBeInTheDocument();
    expect(screen.getByText(/Mein Text\./)).toBeInTheDocument();
  });

  it('zeigt Region-Label "Generierte Dokumentation"', () => {
    setup({ markdown: '# Doku' });
    expect(
      screen.getByRole('region', { name: /Generierte Dokumentation/i }),
    ).toBeInTheDocument();
  });

  it('zeigt Kopieren-, Neu-generieren- und Zurücksetzen-Buttons', () => {
    setup({ markdown: '# Doku' });
    expect(screen.getByRole('button', { name: /kopier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neu generieren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zurücksetzen/i })).toBeInTheDocument();
  });
});

describe('DocGeneratorOutputPanel — User-Interaktionen', () => {
  it('ruft onRegenerate beim Klick', async () => {
    const user = userEvent.setup();
    const { onRegenerate } = setup({ markdown: '# Doku' });
    await user.click(screen.getByRole('button', { name: /Neu generieren/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it('ruft onReset beim Klick auf Zurücksetzen', async () => {
    const user = userEvent.setup();
    const { onReset } = setup({ markdown: '# Doku' });
    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('schreibt Markdown in die Zwischenablage beim Kopieren', async () => {
    const markdown = '# Mein Titel\n\nText.';
    setup({ markdown });
    fireEvent.click(screen.getByRole('button', { name: /kopier/i }));
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(markdown));
  });
});

describe('DocGeneratorOutputPanel — Error-Zustand', () => {
  it('zeigt InlineError wenn error gesetzt ist', () => {
    setup({ markdown: '# Doku', error: new Error('Generierung fehlgeschlagen') });
    expect(screen.getByRole('alert')).toHaveTextContent(/Generierung fehlgeschlagen/);
  });

  it('zeigt keinen Error wenn error null ist', () => {
    setup({ markdown: '# Doku', error: null });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Neu-generieren-Button bleibt im Error-Zustand klickbar', async () => {
    const user = userEvent.setup();
    const { onRegenerate } = setup({
      markdown: '# Doku',
      error: new Error('API down'),
    });
    await user.click(screen.getByRole('button', { name: /Neu generieren/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });
});

describe('DocGeneratorOutputPanel — A11y', () => {
  it('content-Container hat aria-live="polite" und tabIndex={-1}', () => {
    setup({ markdown: '# Doku' });
    const region = screen.getByRole('region', { name: /Generierte Dokumentation/i });
    const liveContainer = region.querySelector('[aria-live="polite"]');
    expect(liveContainer).toBeInTheDocument();
    expect(liveContainer).toHaveAttribute('tabIndex', '-1');
  });

  it('aria-busy reflektiert isLoading', () => {
    setup({ isLoading: true });
    const region = screen.getByRole('region', { name: /Generierte Dokumentation/i });
    const liveContainer = region.querySelector('[aria-live="polite"]');
    expect(liveContainer).toHaveAttribute('aria-busy', 'true');
  });
});
