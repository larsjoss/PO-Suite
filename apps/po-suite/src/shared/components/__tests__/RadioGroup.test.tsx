import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from '../RadioGroup';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('RadioGroup', () => {
  it('rendert fieldset mit role="radiogroup"', () => {
    render(<RadioGroup legend="Auswahl" name="test" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('zeigt Legend-Text', () => {
    render(<RadioGroup legend="Priorität" name="p" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText('Priorität')).toBeInTheDocument();
  });

  it('versteckt Legend visuell bei hideLegend', () => {
    render(<RadioGroup legend="Hidden" hideLegend name="p" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText('Hidden')).toHaveClass('sr-only');
  });

  it('rendert alle Optionen', () => {
    render(<RadioGroup legend="L" name="n" value="a" onChange={() => {}} options={options} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('ausgewählte Option ist checked', () => {
    render(<RadioGroup legend="L" name="n" value="b" onChange={() => {}} options={options} />);
    expect(screen.getByDisplayValue('b')).toBeChecked();
    expect(screen.getByDisplayValue('a')).not.toBeChecked();
  });

  it('ruft onChange mit ausgewähltem Wert auf', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioGroup legend="L" name="n" value="a" onChange={onChange} options={options} />);
    await user.click(screen.getByDisplayValue('c'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('deaktiviert eine Option wenn disabled=true', () => {
    const opts = [...options, { value: 'd', label: 'Option D', disabled: true }];
    render(<RadioGroup legend="L" name="n" value="a" onChange={() => {}} options={opts} />);
    expect(screen.getByDisplayValue('d')).toBeDisabled();
    expect(screen.getByDisplayValue('a')).not.toBeDisabled();
  });
});
