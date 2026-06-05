import { describe, it, expect } from 'vitest';
import {
  STORY_COACH_CONFIG,
  TESTCASE_COACH_CONFIG,
  DOC_COACH_CONFIG,
  GOAL_COACH_CONFIG,
  POLISH_COACH_CONFIG,
} from '../coachConfig';
import type { CoachConfig } from '../../types/coach';

const ALL_CONFIGS: [string, CoachConfig][] = [
  ['STORY', STORY_COACH_CONFIG],
  ['TESTCASE', TESTCASE_COACH_CONFIG],
  ['DOC', DOC_COACH_CONFIG],
  ['GOAL', GOAL_COACH_CONFIG],
  ['POLISH', POLISH_COACH_CONFIG],
];

describe('coachConfig — Vollständigkeit', () => {
  it.each(ALL_CONFIGS)('%s hat toolId', (_, config) => {
    expect(config.toolId).toBeTruthy();
  });

  it.each(ALL_CONFIGS)('%s hat mindestens einen completedStep', (_, config) => {
    expect(config.completedSteps.length).toBeGreaterThan(0);
  });

  it.each(ALL_CONFIGS)('%s hat mindestens eine Suggestion', (_, config) => {
    expect(config.suggestions.length).toBeGreaterThan(0);
  });

  it.each(ALL_CONFIGS)('%s hat maximal 3 Suggestions', (_, config) => {
    expect(config.suggestions.length).toBeLessThanOrEqual(3);
  });

  it.each(ALL_CONFIGS)('%s — jeder Step hat id, label, doneBy', (_, config) => {
    for (const step of config.completedSteps) {
      expect(step.id).toBeTruthy();
      expect(step.label).toBeTruthy();
      expect(['suite', 'manual']).toContain(step.doneBy);
    }
  });

  it.each(ALL_CONFIGS)('%s — jede Suggestion hat id, label, priority 1-3', (_, config) => {
    for (const s of config.suggestions) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect([1, 2, 3]).toContain(s.priority);
    }
  });

  it('STORY — erster Step ist done=true (suite erledigt)', () => {
    expect(STORY_COACH_CONFIG.completedSteps[0].done).toBe(true);
    expect(STORY_COACH_CONFIG.completedSteps[0].doneBy).toBe('suite');
  });

  it('POLISH — sprintContextText ist leer', () => {
    expect(POLISH_COACH_CONFIG.sprintContextText).toBe('');
  });
});
