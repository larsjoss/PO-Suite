import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('rendert Children als Label', () => {
    render(<Button>Klick mich</Button>);
    expect(screen.getByRole('button', { name: 'Klick mich' })).toBeInTheDocument();
  });

  it('triggert onClick beim Klick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('default-type ist "button"', () => {
    render(<Button>X</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('respektiert type="submit"', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('disabled blockiert Klicks und ist im DOM gesetzt', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>X</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading=true setzt aria-busy und disabled', () => {
    render(<Button loading>Sende</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('loading=false setzt aria-busy nicht', () => {
    render(<Button>X</Button>);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('rendert Spinner-SVG bei loading=true', () => {
    const { container } = render(<Button loading>X</Button>);
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('aria-label setzt accessible name unabhängig vom Children', () => {
    render(<Button aria-label="Beschreibung">×</Button>);
    expect(screen.getByRole('button', { name: 'Beschreibung' })).toBeInTheDocument();
  });

  it('Variant-Klassen werden gesetzt (primary default)', () => {
    const { rerender } = render(<Button>X</Button>);
    expect(screen.getByRole('button').className).toMatch(/bg-brand/);

    rerender(<Button variant="outline">X</Button>);
    expect(screen.getByRole('button').className).toMatch(/border-brand/);
  });
});
