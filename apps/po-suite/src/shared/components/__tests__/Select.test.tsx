import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('rendert native select mit allen Optionen', () => {
    render(<Select id="s" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('zeigt label wenn übergeben', () => {
    render(<Select id="s" label="Kategorie" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText('Kategorie')).toBeInTheDocument();
  });

  it('versteckt label visuell bei hideLabel', () => {
    render(<Select id="s" label="Versteckt" hideLabel value="a" onChange={() => {}} options={options} />);
    const label = screen.getByText('Versteckt');
    expect(label).toHaveClass('sr-only');
  });

  it('selektierter Wert ist gesetzt', () => {
    render(<Select id="s" value="b" onChange={() => {}} options={options} />);
    expect(screen.getByRole('combobox')).toHaveValue('b');
  });

  it('ruft onChange mit neuem Wert auf', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select id="s" value="a" onChange={onChange} options={options} />);
    await user.selectOptions(screen.getByRole('combobox'), 'c');
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('ist disabled wenn disabled=true', () => {
    render(<Select id="s" value="a" onChange={() => {}} options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('verknüpft label mit select via htmlFor/id', () => {
    render(<Select id="my-select" label="Sortierung" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByLabelText('Sortierung')).toBeInTheDocument();
  });
});
