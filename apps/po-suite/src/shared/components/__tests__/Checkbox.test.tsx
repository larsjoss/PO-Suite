import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
  it('rendert Label-Text', () => {
    render(<Checkbox label="AGB akzeptieren" checked={false} onChange={() => {}} />);
    expect(screen.getByText('AGB akzeptieren')).toBeInTheDocument();
  });

  it('ist angehakt wenn checked=true', () => {
    render(<Checkbox label="Test" checked={true} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('ist nicht angehakt wenn checked=false', () => {
    render(<Checkbox label="Test" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('hat aria-checked="mixed" im indeterminate-Zustand', () => {
    render(<Checkbox label="Test" checked={false} indeterminate onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('ruft onChange mit true auf wenn unchecked angeklickt', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Test" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('ruft onChange mit false auf wenn checked angeklickt', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Test" checked={true} onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('ist disabled wenn disabled=true', () => {
    render(<Checkbox label="Test" checked={false} disabled onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('nutzt externen id wenn übergeben', () => {
    render(<Checkbox id="my-cb" label="Test" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'my-cb');
  });
});
