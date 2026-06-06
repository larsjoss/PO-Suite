import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('rendert Schalter mit role="switch"', () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('zeigt aria-checked=true wenn checked', () => {
    render(<Toggle checked={true} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('zeigt aria-checked=false wenn nicht checked', () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('ruft onChange mit !checked auf', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('ruft onChange mit false auf wenn checked=true', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('zeigt label-Text wenn label übergeben', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Benachrichtigungen" />);
    expect(screen.getByText('Benachrichtigungen')).toBeInTheDocument();
  });

  it('nutzt aria-label wenn kein label-Prop', () => {
    render(<Toggle checked={false} onChange={() => {}} aria-label="Toggle aktivieren" />);
    expect(screen.getByRole('switch', { name: 'Toggle aktivieren' })).toBeInTheDocument();
  });

  it('ist disabled wenn disabled=true', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('ruft onChange nicht auf wenn disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
