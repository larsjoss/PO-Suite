import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from './CopyButton';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeTextMock.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    writable: true,
    configurable: true,
  });
});

describe('CopyButton', () => {
  it('rendert default-Label "Inhalt kopieren"', () => {
    render(<CopyButton text="Foo" />);
    expect(screen.getByRole('button', { name: /Inhalt kopieren/i })).toBeInTheDocument();
  });

  it('respektiert custom label', () => {
    render(<CopyButton text="Foo" label="Story" />);
    expect(screen.getByRole('button', { name: /Story kopieren/i })).toBeInTheDocument();
  });

  it('schreibt text in die Zwischenablage beim Klick', async () => {
    render(<CopyButton text="Mein zu kopierender Text" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith('Mein zu kopierender Text'),
    );
  });

  it('aria-label wechselt zu "kopiert" nach Klick', async () => {
    render(<CopyButton text="x" label="Doku" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Doku kopiert/i })).toBeInTheDocument(),
    );
  });

  it('zeigt "Kopiert!" Text nach Klick', async () => {
    render(<CopyButton text="x" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/Kopiert!/)).toBeInTheDocument(),
    );
  });
});
