import { describe, it, expect } from 'vitest';
import {
  buildJiraMarkdown,
  buildSingleTcMarkdown,
  getAvailableTypes,
  getAvailableLevels,
} from './testCaseGenerator';
import type { TestCase, TestPlan } from '../types';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeTc = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: 'TC-01',
  title: 'Nutzer kann sich einloggen',
  type: 'happy_path',
  level: 'INTG',
  preconditions: ['Nutzer ist ausgeloggt', 'Gültige Credentials vorhanden'],
  steps: [
    { step: 1, action: 'Öffne die Login-Seite' },
    { step: 2, action: 'Gib gültige Credentials ein' },
    { step: 3, action: 'Klicke Anmelden' },
  ],
  expected_result: 'Nutzer ist eingeloggt und wird auf das Dashboard weitergeleitet.',
  linked_aks: ['AK-1'],
  source: 'story_ak',
  ...overrides,
});

const makeSummary = () => ({
  total_count: 1,
  by_type: { happy_path: 1 } as Partial<Record<string, number>>,
  by_level: { INTG: 1 } as Partial<Record<string, number>>,
  ak_coverage: [{ ak_id: 'AK-1', covered: true, tc_count: 1 }],
  gaps: [] as string[],
  risk_flags: [] as string[],
});

const makePlan = (overrides: Partial<TestPlan> = {}): TestPlan => ({
  story_id: null,
  story_title: 'Login-Feature',
  generated_at: '2025-04-29T12:00:00.000Z',
  input_sources: { has_screenshot: false, has_test_context: false, screenshot_count: 0 },
  test_cases: [makeTc()],
  summary: makeSummary(),
  ...overrides,
});

// ─── buildJiraMarkdown ────────────────────────────────────────────────────────

describe('buildJiraMarkdown', () => {
  it('contains the story title', () => {
    expect(buildJiraMarkdown(makePlan())).toContain('Login-Feature');
  });

  it('contains the TC id and title', () => {
    const out = buildJiraMarkdown(makePlan());
    expect(out).toContain('TC-01');
    expect(out).toContain('Nutzer kann sich einloggen');
  });

  it('contains AK-Coverage section with covered marker', () => {
    const out = buildJiraMarkdown(makePlan());
    expect(out).toContain('AK-Coverage');
    expect(out).toContain('[x] AK-1');
  });

  it('marks uncovered AK with empty checkbox', () => {
    const plan = makePlan({
      summary: {
        ...makeSummary(),
        ak_coverage: [{ ak_id: 'AK-2', covered: false, tc_count: 0 }],
      },
    });
    const out = buildJiraMarkdown(plan);
    expect(out).toContain('[ ] AK-2');
    expect(out).toContain('Nicht vollständig testbar');
  });

  it('includes gap entries when present', () => {
    const plan = makePlan({
      summary: { ...makeSummary(), gaps: ['AK-3 nicht testbar ohne Staging-Umgebung'] },
    });
    expect(buildJiraMarkdown(plan)).toContain('AK-3 nicht testbar ohne Staging-Umgebung');
  });

  it('includes risk flag entries when present', () => {
    const plan = makePlan({
      summary: { ...makeSummary(), risk_flags: ['AK-1 enthält Team-Entscheid'] },
    });
    expect(buildJiraMarkdown(plan)).toContain('AK-1 enthält Team-Entscheid');
  });

  it('includes preconditions and steps', () => {
    const out = buildJiraMarkdown(makePlan());
    expect(out).toContain('Nutzer ist ausgeloggt');
    expect(out).toContain('Öffne die Login-Seite');
    expect(out).toContain('Gib gültige Credentials ein');
  });

  it('includes expected result', () => {
    const out = buildJiraMarkdown(makePlan());
    expect(out).toContain(
      'Nutzer ist eingeloggt und wird auf das Dashboard weitergeleitet.',
    );
  });

  it('includes flag callout for open_question', () => {
    const plan = makePlan({
      test_cases: [
        makeTc({ flag: { type: 'open_question', message: 'Welche Sprache wird verwendet?' } }),
      ],
    });
    const out = buildJiraMarkdown(plan);
    expect(out).toContain('Offene Frage');
    expect(out).toContain('Welche Sprache wird verwendet?');
  });

  it('shows ENTW and INTG counts in header', () => {
    const plan = makePlan({
      summary: {
        ...makeSummary(),
        by_level: { ENTW: 2, INTG: 3 },
      },
    });
    const out = buildJiraMarkdown(plan);
    expect(out).toContain('ENTW: 2');
    expect(out).toContain('INTG: 3');
  });
});

// ─── buildSingleTcMarkdown ────────────────────────────────────────────────────

describe('buildSingleTcMarkdown', () => {
  it('includes TC id and title', () => {
    const out = buildSingleTcMarkdown(makeTc());
    expect(out).toContain('TC-01');
    expect(out).toContain('Nutzer kann sich einloggen');
  });

  it('includes type label and level', () => {
    const out = buildSingleTcMarkdown(makeTc());
    expect(out).toContain('Happy Path');
    expect(out).toContain('INTG');
  });

  it('includes numbered steps', () => {
    const out = buildSingleTcMarkdown(makeTc());
    expect(out).toContain('1. Öffne die Login-Seite');
    expect(out).toContain('2. Gib gültige Credentials ein');
  });

  it('includes expected result', () => {
    const out = buildSingleTcMarkdown(makeTc());
    expect(out).toContain('Nutzer ist eingeloggt und wird auf das Dashboard weitergeleitet.');
  });

  it('includes flag type and message when flag present', () => {
    const out = buildSingleTcMarkdown(
      makeTc({ flag: { type: 'risk', message: 'Kritischer Pfad.' } }),
    );
    expect(out).toContain('risk');
    expect(out).toContain('Kritischer Pfad.');
  });
});

// ─── getAvailableTypes ────────────────────────────────────────────────────────

describe('getAvailableTypes', () => {
  it('returns unique types from test cases', () => {
    const cases = [
      makeTc({ id: 'TC-01', type: 'happy_path' }),
      makeTc({ id: 'TC-02', type: 'edge_case' }),
      makeTc({ id: 'TC-03', type: 'happy_path' }),
    ];
    const types = getAvailableTypes(cases);
    expect(types).toHaveLength(2);
    expect(types).toContain('happy_path');
    expect(types).toContain('edge_case');
  });

  it('returns empty array for empty input', () => {
    expect(getAvailableTypes([])).toHaveLength(0);
  });
});

// ─── getAvailableLevels ───────────────────────────────────────────────────────

describe('getAvailableLevels', () => {
  it('returns unique levels from test cases', () => {
    const cases = [
      makeTc({ id: 'TC-01', level: 'ENTW' }),
      makeTc({ id: 'TC-02', level: 'INTG' }),
      makeTc({ id: 'TC-03', level: 'ENTW' }),
    ];
    const levels = getAvailableLevels(cases);
    expect(levels).toHaveLength(2);
    expect(levels).toContain('ENTW');
    expect(levels).toContain('INTG');
  });

  it('returns empty array for empty input', () => {
    expect(getAvailableLevels([])).toHaveLength(0);
  });
});
