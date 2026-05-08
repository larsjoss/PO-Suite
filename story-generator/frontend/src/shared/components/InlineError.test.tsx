import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineError } from './InlineError';

describe('InlineError', () => {
  it('rendert die Message', () => {
    render(<InlineError message="Etwas ist schief gelaufen" />);
    expect(screen.getByText(/Etwas ist schief gelaufen/)).toBeInTheDocument();
  });

  it('hat role="alert" für Screen Reader (WCAG 4.1.3)', () => {
    render(<InlineError message="Fehler" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('hat aria-live="assertive" für sofortige Bekanntmachung', () => {
    render(<InlineError message="Fehler" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('rendert Icon mit aria-hidden="true"', () => {
    const { container } = render(<InlineError message="x" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('respektiert custom className', () => {
    render(<InlineError message="x" className="mt-4" />);
    expect(screen.getByRole('alert').className).toMatch(/mt-4/);
  });
});
