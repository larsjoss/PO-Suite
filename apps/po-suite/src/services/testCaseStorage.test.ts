import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTestPlan,
  getTestPlans,
  getTestPlan,
  deleteTestPlan,
} from './testCaseStorage';
import type { TestPlan } from '../types';

const basePlan: TestPlan = {
  story_id: 'TC-1',
  story_title: 'Login Feature',
  generated_at: '2024-01-01T00:00:00.000Z',
  input_sources: { has_screenshot: false, has_test_context: false, screenshot_count: 0 },
  test_cases: [],
  summary: {
    total_count: 0,
    by_type: {},
    by_level: {},
    ak_coverage: [],
    gaps: [],
    risk_flags: [],
  },
};

beforeEach(() => {
  localStorage.clear();
});

describe('createTestPlan', () => {
  it('speichert einen neuen Plan und gibt ihn zurück', () => {
    const stored = createTestPlan(basePlan, 'Story-Text');
    expect(stored.id).toBeTruthy();
    expect(stored.story_title).toBe('Login Feature');
    expect(stored.storyText).toBe('Story-Text');
    expect(stored.createdAt).toBeTruthy();
  });

  it('neuester Plan kommt zuerst', () => {
    const first = createTestPlan({ ...basePlan, story_title: 'Erster' }, 'text1');
    const second = createTestPlan({ ...basePlan, story_title: 'Zweiter' }, 'text2');
    const { plans } = getTestPlans();
    expect(plans[0].id).toBe(second.id);
    expect(plans[1].id).toBe(first.id);
  });

  it('wirft bei vollem localStorage', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => createTestPlan(basePlan, 'text')).toThrow('Speicher voll');
    spy.mockRestore();
  });
});

describe('getTestPlans', () => {
  it('gibt leere Liste zurück wenn keine Pläne', () => {
    const { plans, total } = getTestPlans();
    expect(plans).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('filtert nach story_title', () => {
    createTestPlan({ ...basePlan, story_title: 'Login Feature' }, 'text');
    createTestPlan({ ...basePlan, story_title: 'Search Feature' }, 'text');
    const { plans } = getTestPlans('login');
    expect(plans).toHaveLength(1);
    expect(plans[0].story_title).toBe('Login Feature');
  });

  it('filtert nach storyText', () => {
    createTestPlan(basePlan, 'Als Nutzer möchte ich mich anmelden');
    createTestPlan(basePlan, 'Als Nutzer möchte ich suchen');
    const { plans } = getTestPlans('anmelden');
    expect(plans).toHaveLength(1);
  });

  it('gibt alle Pläne bei leerem Query zurück', () => {
    createTestPlan(basePlan, 'text1');
    createTestPlan(basePlan, 'text2');
    const { plans, total } = getTestPlans('');
    expect(total).toBe(2);
    expect(plans).toHaveLength(2);
  });
});

describe('getTestPlan', () => {
  it('gibt einen Plan anhand der ID zurück', () => {
    const stored = createTestPlan(basePlan, 'Story');
    const found = getTestPlan(stored.id);
    expect(found.id).toBe(stored.id);
    expect(found.story_title).toBe('Login Feature');
  });

  it('wirft wenn Plan nicht gefunden', () => {
    expect(() => getTestPlan('nonexistent-id')).toThrow('Testplan nicht gefunden');
  });
});

describe('deleteTestPlan', () => {
  it('entfernt den Plan aus dem Speicher', () => {
    const stored = createTestPlan(basePlan, 'Story');
    deleteTestPlan(stored.id);
    expect(() => getTestPlan(stored.id)).toThrow('Testplan nicht gefunden');
  });

  it('lässt andere Pläne unberührt', () => {
    const a = createTestPlan({ ...basePlan, story_title: 'A' }, 'text');
    const b = createTestPlan({ ...basePlan, story_title: 'B' }, 'text');
    deleteTestPlan(a.id);
    expect(() => getTestPlan(b.id)).not.toThrow();
  });

  it('tut nichts bei unbekannter ID', () => {
    createTestPlan(basePlan, 'Story');
    expect(() => deleteTestPlan('unbekannt')).not.toThrow();
    expect(getTestPlans().total).toBe(1);
  });
});
