import type { TestCaseType, TestLevel } from '../../types';

export const TYPE_LABELS: Record<TestCaseType, string> = {
  happy_path: 'Happy Path',
  unhappy_path: 'Unhappy Path',
  edge_case: 'Edge Case',
  ui_responsiveness: 'UI/Responsive',
  multilingual: 'Mehrsprachigkeit',
  analytics: 'Analytics',
  backwards_compatibility: 'Rückwärtskompatib.',
  accessibility: 'Accessibility',
};

export const TYPE_BADGE_COLORS: Record<TestCaseType, string> = {
  happy_path: 'bg-green-100 text-green-800',
  unhappy_path: 'bg-red-100 text-red-700',
  edge_case: 'bg-orange-100 text-orange-800',
  ui_responsiveness: 'bg-blue-100 text-blue-800',
  multilingual: 'bg-purple-100 text-purple-800',
  analytics: 'bg-teal-100 text-teal-800',
  backwards_compatibility: 'bg-gray-100 text-gray-700',
  accessibility: 'bg-indigo-100 text-indigo-800',
};

export const LEVEL_BADGE_COLORS: Record<TestLevel, string> = {
  ENTW: 'bg-amber-100 text-amber-800',
  INTG: 'bg-blue-100 text-blue-800',
  'ENTW+INTG': 'bg-purple-100 text-purple-800',
};
