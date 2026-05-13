import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevealButton } from './RevealButton';

describe('RevealButton', () => {
  it('rendert mit aria-label aus prop', () => {
    render(<RevealButton show={false} onToggle={() => {}} label="Passwort anzeigen" />);
    expect(screen.getByRole('button', { name: 'Passwort anzeigen' })).toBeInTheDocument();
  });

  it('triggert onToggle beim Klick', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<RevealButton show={false} onToggle={onToggle} label="x" />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('hat WCAG 2.5.5 Touch-Target (min 44×44 px)', () => {
    render(<RevealButton show={false} onToggle={() => {}} label="x" />);
    const className = screen.getByRole('button').className;
    expect(className).toMatch(/min-h-\[44px\]/);
    expect(className).toMatch(/min-w-\[44px\]/);
  });

  it('rendert EyeIcon bei show=false', () => {
    const { container } = render(<RevealButton show={false} onToggle={() => {}} label="x" />);
    // EyeIcon hat zwei <path> (Kreis + Lid)
    const paths = container.querySelectorAll('svg path');
    expect(paths).toHaveLength(2);
  });

  it('rendert EyeOffIcon bei show=true (anderer Pfad)', () => {
    const { container } = render(<RevealButton show={true} onToggle={() => {}} label="x" />);
    // EyeOffIcon hat einen einzelnen langen path
    const paths = container.querySelectorAll('svg path');
    expect(paths).toHaveLength(1);
  });
});
