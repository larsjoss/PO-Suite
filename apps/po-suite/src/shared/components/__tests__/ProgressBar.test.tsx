import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('hat role="progressbar"', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('setzt aria-valuenow auf übergebenen Wert', () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('hat kein aria-valuenow bei unbestimmtem Zustand (value=undefined)', () => {
    render(<ProgressBar />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('klemmt Wert auf 0–100', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('zeigt label', () => {
    render(<ProgressBar value={30} label="Laden…" />);
    expect(screen.getByText('Laden…')).toBeInTheDocument();
  });

  it('zeigt Prozentwert bei showPercent', () => {
    render(<ProgressBar value={42} showPercent />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('zeigt keinen Prozentwert bei unbestimmtem Zustand', () => {
    render(<ProgressBar showPercent />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('hat aria-valuemin=0 und aria-valuemax=100', () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});
