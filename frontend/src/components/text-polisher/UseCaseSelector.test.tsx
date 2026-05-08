import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UseCaseSelector } from './UseCaseSelector';
import type { UseCase } from '../../hooks/useTextPolisher';

function setup(value: UseCase = 'email', onChange = vi.fn()) {
  render(<UseCaseSelector value={value} onChange={onChange} />);
  return { onChange };
}

describe('UseCaseSelector', () => {
  it('renders all three tabs', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'E-Mail' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Meeting-Summary' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Freitext' })).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    setup('meeting');
    expect(screen.getByRole('tab', { name: 'Meeting-Summary' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'E-Mail' })).toHaveAttribute('aria-selected', 'false');
  });

  it('only the active tab has tabIndex 0', () => {
    setup('freetext');
    expect(screen.getByRole('tab', { name: 'Freitext' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'E-Mail' })).toHaveAttribute('tabindex', '-1');
  });

  it('calls onChange on click', async () => {
    const { onChange } = setup('email');
    await userEvent.click(screen.getByRole('tab', { name: 'Freitext' }));
    expect(onChange).toHaveBeenCalledWith('freetext');
  });

  it('moves to next tab with ArrowRight', async () => {
    const { onChange } = setup('email');
    await userEvent.type(screen.getByRole('tab', { name: 'E-Mail' }), '{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('meeting');
  });

  it('moves to previous tab with ArrowLeft', async () => {
    const { onChange } = setup('meeting');
    await userEvent.type(screen.getByRole('tab', { name: 'Meeting-Summary' }), '{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('email');
  });

  it('jumps to first tab with Home key', async () => {
    const { onChange } = setup('freetext');
    await userEvent.type(screen.getByRole('tab', { name: 'Freitext' }), '{Home}');
    expect(onChange).toHaveBeenCalledWith('email');
  });

  it('jumps to last tab with End key', async () => {
    const { onChange } = setup('email');
    await userEvent.type(screen.getByRole('tab', { name: 'E-Mail' }), '{End}');
    expect(onChange).toHaveBeenCalledWith('freetext');
  });

  it('wraps from last to first with ArrowRight', async () => {
    const { onChange } = setup('freetext');
    await userEvent.type(screen.getByRole('tab', { name: 'Freitext' }), '{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('email');
  });
});
