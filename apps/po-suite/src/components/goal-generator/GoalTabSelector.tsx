import type { GoalMode } from '../../types';
import { TabBar } from '../../shared/components';

const TABS = [
  { id: 'sprint-goal' as GoalMode, label: 'Sprint Goal' },
  { id: 'pi-objective' as GoalMode, label: 'PI Objective' },
];

interface Props {
  value: GoalMode;
  onChange: (mode: GoalMode) => void;
  disabled?: boolean;
}

export function GoalTabSelector({ value, onChange, disabled }: Props) {
  return (
    <TabBar
      tabs={TABS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      idPrefix="gg"
      aria-label="Modus auswählen"
    />
  );
}
