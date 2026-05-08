import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToneSelector } from './ToneSelector';
import type { Tone } from '../../hooks/useTextPolisher';

function setup(value: Tone = 'formell', onChange = vi.fn()) {
  render(<ToneSelector value={value} onChange={onChange} />);
  return { onChange };
}

describe('ToneSelector', () => {
  it('renders all three tone options', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Formell' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Informell' })).toBeInTheDocument();
  });

  it('marks the current value as checked', () => {
    setup('neutral');
    expect(screen.getByRole('radio', { name: 'Neutral' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Formell' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when a different option is clicked', async () => {
    const { onChange } = setup('formell');
    await userEvent.click(screen.getByRole('radio', { name: 'Informell' }));
    expect(onChange).toHaveBeenCalledWith('informell');
  });

  it('does not call onChange when the active option is clicked', async () => {
    const { onChange } = setup('neutral');
    await userEvent.click(screen.getByRole('radio', { name: 'Neutral' }));
    expect(onChange).toHaveBeenCalledWith('neutral');
  });

  it('moves to next option with ArrowRight', async () => {
    const { onChange } = setup('formell');
    await userEvent.type(screen.getByRole('radio', { name: 'Formell' }), '{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('neutral');
  });

  it('moves to previous option with ArrowLeft', async () => {
    const { onChange } = setup('neutral');
    await userEvent.type(screen.getByRole('radio', { name: 'Neutral' }), '{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('formell');
  });

  it('wraps from last to first with ArrowRight', async () => {
    const { onChange } = setup('informell');
    await userEvent.type(screen.getByRole('radio', { name: 'Informell' }), '{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('formell');
  });

  it('wraps from first to last with ArrowLeft', async () => {
    const { onChange } = setup('formell');
    await userEvent.type(screen.getByRole('radio', { name: 'Formell' }), '{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('informell');
  });

  it('disables all buttons when disabled prop is set', () => {
    render(<ToneSelector value="formell" onChange={vi.fn()} disabled />);
    screen.getAllByRole('radio').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
