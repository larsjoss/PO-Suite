import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalGeneratorOutputPanel } from './GoalGeneratorOutputPanel';
import type { GoalVariant } from '../../types';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeTextMock.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    writable: true,
    configurable: true,
  });
});

const makeVariant = (overrides: Partial<GoalVariant> = {}): GoalVariant => ({
  text: 'Sprint Goal Text',
  rationale: 'Outcome ist klar.',
  weakness: undefined,
  ...overrides,
});

interface SetupOverrides {
  mode?: 'sprint-goal' | 'pi-objective';
  variants?: GoalVariant[];
  isGenerating?: boolean;
  generateError?: Error | null;
  outputView?: 'variants' | 'refining';
  selectedVariant?: GoalVariant | null;
  refinedVariant?: GoalVariant | null;
  refinementHint?: string;
  isRefining?: boolean;
  refineError?: Error | null;
}

function setup(overrides: SetupOverrides = {}) {
  const handlers = {
    onRegenerate: vi.fn(),
    onReset: vi.fn(),
    onSelectForRefine: vi.fn(),
    onRefinementHintChange: vi.fn(),
    onRefineSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onBackToVariants: vi.fn(),
  };
  const props = {
    mode: 'sprint-goal' as const,
    variants: [],
    isGenerating: false,
    generateError: null,
    outputView: 'variants' as const,
    selectedVariant: null,
    refinedVariant: null,
    refinementHint: '',
    isRefining: false,
    refineError: null,
    ...overrides,
  };
  render(
    <GoalGeneratorOutputPanel
      {...props}
      {...handlers}
      contentRef={createRef<HTMLDivElement>()}
    />,
  );
  return handlers;
}

// ─── Loading-Zustand ──────────────────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — Loading', () => {
  it('zeigt Loading-Hinweis und Skeleton', () => {
    setup({ isGenerating: true });
    expect(screen.getByText(/werden generiert/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('blendet Variants-View während Loading aus', () => {
    setup({ isGenerating: true, variants: [makeVariant()] });
    expect(screen.queryByRole('article', { name: /Variante 1/i })).not.toBeInTheDocument();
  });
});

// ─── Variants-View ────────────────────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — Variants-View', () => {
  it('rendert mehrere Varianten als Artikel', () => {
    setup({
      variants: [
        makeVariant({ text: 'Goal eins.' }),
        makeVariant({ text: 'Goal zwei.' }),
      ],
    });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Goal eins.')).toBeInTheDocument();
    expect(screen.getByText('Goal zwei.')).toBeInTheDocument();
  });

  it('zeigt Neu-generieren- und Zurücksetzen-Buttons', () => {
    setup({ variants: [makeVariant()] });
    expect(screen.getByRole('button', { name: /Neu generieren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zurücksetzen/i })).toBeInTheDocument();
  });

  it('ruft onRegenerate beim Klick', async () => {
    const user = userEvent.setup();
    const { onRegenerate } = setup({ variants: [makeVariant()] });
    await user.click(screen.getByRole('button', { name: /Neu generieren/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it('ruft onReset beim Klick', async () => {
    const user = userEvent.setup();
    const { onReset } = setup({ variants: [makeVariant()] });
    await user.click(screen.getByRole('button', { name: /Zurücksetzen/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('zeigt InlineError für generateError', () => {
    setup({
      variants: [makeVariant()],
      generateError: new Error('Generierung fehlgeschlagen'),
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Generierung fehlgeschlagen/);
  });

  it('rendert Verfeinern-Button pro Variante und ruft onSelectForRefine', async () => {
    const user = userEvent.setup();
    const variant = makeVariant({ text: 'Goal eins.' });
    const { onSelectForRefine } = setup({ variants: [variant] });

    const refineButtons = screen.getAllByRole('button', { name: /verfeinern/i });
    expect(refineButtons.length).toBeGreaterThan(0);
    await user.click(refineButtons[0]);
    expect(onSelectForRefine).toHaveBeenCalledWith(variant);
  });
});

// ─── Refining-View ────────────────────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — Refining-View', () => {
  it('zeigt "Ausgewählte Variante" Label', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant({ text: 'Gewählte Variante' }),
    });
    expect(screen.getAllByText(/Ausgewählte Variante/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Gewählte Variante')).toBeInTheDocument();
  });

  it('zeigt "Verfeinerte Variante" Label nach Verfeinerung', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant({ text: 'Original' }),
      refinedVariant: makeVariant({ text: 'Verfeinert' }),
    });
    expect(screen.getAllByText(/Verfeinerte Variante/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Verfeinert')).toBeInTheDocument();
  });

  it('rendert "Zurück zu allen Varianten"-Button und ruft onBackToVariants', async () => {
    const user = userEvent.setup();
    const { onBackToVariants } = setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
    });
    await user.click(screen.getByRole('button', { name: /Zurück zu allen/i }));
    expect(onBackToVariants).toHaveBeenCalledOnce();
  });

  it('Verfeinern-Button ist disabled bei leerem Hinweis', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
      refinementHint: '',
    });
    const submit = screen.getByRole('button', { name: /^Verfeinern$/i });
    expect(submit).toBeDisabled();
  });

  it('Verfeinern-Button ist enabled mit Hinweis', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
      refinementHint: 'kürzer',
    });
    const submit = screen.getByRole('button', { name: /^Verfeinern$/i });
    expect(submit).not.toBeDisabled();
  });

  it('Button-Label wechselt nach erster Verfeinerung zu "Erneut verfeinern"', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
      refinedVariant: makeVariant({ text: 'Verfeinert' }),
      refinementHint: 'noch kürzer',
    });
    expect(screen.getByRole('button', { name: /Erneut verfeinern/i })).toBeInTheDocument();
  });

  it('zeigt InlineError für refineError', () => {
    setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
      refineError: new Error('Refinement-Fehler'),
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Refinement-Fehler/);
  });

  it('triggert onRefineSubmit beim Submit des Refinement-Forms', () => {
    const { onRefineSubmit } = setup({
      outputView: 'refining',
      selectedVariant: makeVariant(),
      refinementHint: 'kürzer',
    });
    const form = screen.getByRole('button', { name: /^Verfeinern$/i }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(onRefineSubmit).toHaveBeenCalledOnce();
  });
});

// ─── Mode-spezifisches Rendering ──────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — Mode-Rendering', () => {
  it('rendert Sprint-Goal-Text als plain <p> (kein Markdown)', () => {
    setup({
      mode: 'sprint-goal',
      variants: [makeVariant({ text: '**bold** sprint goal' })],
    });
    // Plain <p> rendert "**bold**" als String, nicht als <strong>
    expect(screen.getByText(/\*\*bold\*\* sprint goal/)).toBeInTheDocument();
  });

  it('rendert PI-Objective-Text als Markdown', () => {
    setup({
      mode: 'pi-objective',
      variants: [makeVariant({ text: '**bold** outcome' })],
    });
    // MarkdownOutput rendert **bold** als <strong>
    const article = screen.getByRole('article', { name: /Variante 1/i });
    expect(article.querySelector('strong')).toBeInTheDocument();
  });
});

// ─── Copy-Funktionalität ──────────────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — Copy', () => {
  it('kopiert Variants-Text in die Zwischenablage', async () => {
    setup({ variants: [makeVariant({ text: 'Goal zum Kopieren.' })] });
    const copyBtn = screen.getByRole('button', { name: /Variante 1.*kopier|kopier.*Variante 1/i });
    fireEvent.click(copyBtn);
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('Goal zum Kopieren.'));
  });
});

// ─── A11y ─────────────────────────────────────────────────────────────────────

describe('GoalGeneratorOutputPanel — A11y', () => {
  it('Region hat aria-label "Generierte Varianten"', () => {
    setup({ variants: [makeVariant()] });
    expect(
      screen.getByRole('region', { name: /Generierte Varianten/i }),
    ).toBeInTheDocument();
  });

  it('content-Container hat aria-live="polite"', () => {
    setup({ variants: [makeVariant()] });
    const region = screen.getByRole('region', { name: /Generierte Varianten/i });
    const liveContainer = region.querySelector('[aria-live="polite"]');
    expect(liveContainer).toBeInTheDocument();
  });

  it('aria-busy reflektiert isGenerating', () => {
    setup({ isGenerating: true });
    const region = screen.getByRole('region', { name: /Generierte Varianten/i });
    const liveContainer = region.querySelector('[aria-live="polite"]');
    expect(liveContainer).toHaveAttribute('aria-busy', 'true');
  });
});
