import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestCaseFilterBar } from './TestCaseFilterBar';
import type { TestCaseType, TestLevel } from '../../types';

const defaults = {
  availableTypes: ['happy_path', 'edge_case', 'unhappy_path'] as TestCaseType[],
  selectedTypes: [] as TestCaseType[],
  selectedLevel: 'all' as TestLevel | 'all',
  onTypeToggle: vi.fn(),
  onResetTypes: vi.fn(),
  onLevelChange: vi.fn(),
  totalCount: 5,
  filteredCount: 5,
};

function setup(overrides: Partial<typeof defaults> = {}) {
  const handlers = {
    onTypeToggle: vi.fn(),
    onResetTypes: vi.fn(),
    onLevelChange: vi.fn(),
  };
  render(<TestCaseFilterBar {...defaults} {...overrides} {...handlers} />);
  return handlers;
}

describe('TestCaseFilterBar', () => {
  describe('Typ-Filter', () => {
    it('rendert nichts wenn keine Types vorhanden', () => {
      const { container } = render(
        <TestCaseFilterBar {...defaults} availableTypes={[]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('rendert einen Checkbox-Chip pro Type', () => {
      setup();
      expect(screen.getByRole('checkbox', { name: 'Happy Path' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Edge Case' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Unhappy Path' })).toBeInTheDocument();
    });

    it('setzt aria-checked=false für nicht selektierte Types', () => {
      setup({ selectedTypes: [] });
      expect(screen.getByRole('checkbox', { name: 'Happy Path' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('setzt aria-checked=true für selektierte Types', () => {
      setup({ selectedTypes: ['happy_path'] });
      expect(screen.getByRole('checkbox', { name: 'Happy Path' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('checkbox', { name: 'Edge Case' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('ruft onTypeToggle beim Klick auf einen Chip auf', async () => {
      const { onTypeToggle } = setup();
      await userEvent.click(screen.getByRole('checkbox', { name: 'Edge Case' }));
      expect(onTypeToggle).toHaveBeenCalledWith('edge_case');
    });

    it('zeigt Zurücksetzen-Button wenn Types selektiert sind', () => {
      setup({ selectedTypes: ['happy_path'] });
      expect(screen.getByRole('button', { name: 'Zurücksetzen' })).toBeInTheDocument();
    });

    it('versteckt Zurücksetzen-Button wenn keine Types selektiert', () => {
      setup({ selectedTypes: [] });
      expect(screen.queryByRole('button', { name: 'Zurücksetzen' })).toBeNull();
    });

    it('ruft onResetTypes beim Klick auf Zurücksetzen auf', async () => {
      const { onResetTypes } = setup({ selectedTypes: ['happy_path'] });
      await userEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }));
      expect(onResetTypes).toHaveBeenCalledOnce();
    });
  });

  describe('Level-Filter (Radiogroup)', () => {
    it('rendert alle vier Optionen', () => {
      setup();
      expect(screen.getByRole('radio', { name: 'Alle' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'ENTW' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'INTG' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'ENTW+INTG' })).toBeInTheDocument();
    });

    it('markiert aktives Level als checked', () => {
      setup({ selectedLevel: 'ENTW' });
      expect(screen.getByRole('radio', { name: 'ENTW' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('radio', { name: 'Alle' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('ruft onLevelChange beim Klick auf eine Level-Option auf', async () => {
      const { onLevelChange } = setup();
      await userEvent.click(screen.getByRole('radio', { name: 'INTG' }));
      expect(onLevelChange).toHaveBeenCalledWith('INTG');
    });

    it('navigiert mit ArrowRight zur nächsten Option', async () => {
      const { onLevelChange } = setup({ selectedLevel: 'all' });
      await userEvent.type(screen.getByRole('radio', { name: 'Alle' }), '{ArrowRight}');
      expect(onLevelChange).toHaveBeenCalledWith('ENTW');
    });

    it('navigiert mit ArrowLeft zur vorherigen Option', async () => {
      const { onLevelChange } = setup({ selectedLevel: 'INTG' });
      await userEvent.type(screen.getByRole('radio', { name: 'INTG' }), '{ArrowLeft}');
      expect(onLevelChange).toHaveBeenCalledWith('ENTW');
    });

    it('springt von der letzten zur ersten Option mit ArrowRight', async () => {
      const { onLevelChange } = setup({ selectedLevel: 'ENTW+INTG' });
      await userEvent.type(screen.getByRole('radio', { name: 'ENTW+INTG' }), '{ArrowRight}');
      expect(onLevelChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Ergebnis-Zähler', () => {
    it('zeigt Gesamtanzahl wenn kein Filter aktiv', () => {
      setup({ totalCount: 5, filteredCount: 5 });
      expect(screen.getByText('5 Testcases')).toBeInTheDocument();
    });

    it('zeigt "X von Y" wenn Filter aktiv', () => {
      setup({ totalCount: 8, filteredCount: 3 });
      expect(screen.getByText('3 von 8 Testcases')).toBeInTheDocument();
    });

    it('zeigt Singular für 1 Testcase', () => {
      setup({ totalCount: 1, filteredCount: 1 });
      expect(screen.getByText('1 Testcase')).toBeInTheDocument();
    });
  });
});
