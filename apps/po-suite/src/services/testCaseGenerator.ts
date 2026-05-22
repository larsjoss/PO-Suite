import type Anthropic from '@anthropic-ai/sdk';
import { getApiClient } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import { buildImageBlock } from '../shared/services/imageBlocks';
import { TEST_CASE_GENERATOR_SYSTEM_PROMPT as SYSTEM_PROMPT } from './prompts/testCaseGenerator';
import type { TestPlan, TestCase, TestCaseType, TestLevel } from '../types';

export interface GenerateTestCasesParams {
  storyText: string;
  testContext?: string;
  screenshots: { base64: string; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' }[];
}

// ─── API Call ─────────────────────────────────────────────────────────────────

export async function generateTestCases(params: GenerateTestCasesParams): Promise<TestPlan> {
  const client = getApiClient();

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  let text = `STORY:\n${params.storyText}`;
  if (params.testContext?.trim()) {
    text += `\n\n---\nTESTKONTEXT:\n${params.testContext.trim()}\n---`;
  }
  if (params.screenshots.length > 0) {
    text += '\n\nDie angehängten Screenshots zeigen das entwickelte UI. Nutze sie als zusätzlichen Kontext.';
  }
  text += '\n\nGeneriere den Testplan als valides JSON-Objekt gemäss dem definierten Schema. Setze story_id auf null wenn keine Jira-ID vorhanden.';

  contentBlocks.push({ type: 'text', text });

  contentBlocks.push(...params.screenshots.map((s) => buildImageBlock(s.base64, s.mediaType)));

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  );

  const rawText = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract outermost JSON object, tolerating preamble/postamble or code fences
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  const jsonStr = start !== -1 && end > start ? rawText.slice(start, end + 1) : rawText;

  let plan: TestPlan;
  try {
    plan = JSON.parse(jsonStr) as TestPlan;
  } catch {
    throw new Error(
      'Der Testplan konnte nicht verarbeitet werden. Das Modell hat kein gültiges JSON zurückgegeben. Bitte erneut versuchen.',
    );
  }

  if (!Array.isArray(plan.test_cases) || !plan.summary) {
    throw new Error('Testplan-Struktur unvollständig. Bitte erneut versuchen.');
  }

  // generated_at zuverlässig im Code setzen
  plan.generated_at = new Date().toISOString();

  return plan;
}

// ─── Jira Markdown Export ─────────────────────────────────────────────────────

const TYPE_LABELS_DE: Record<string, string> = {
  happy_path: 'Happy Path',
  unhappy_path: 'Unhappy Path',
  edge_case: 'Edge Case',
  ui_responsiveness: 'UI/Responsiveness',
  multilingual: 'Mehrsprachigkeit',
  analytics: 'Analytics',
  backwards_compatibility: 'Rückwärtskompatibilität',
  accessibility: 'Accessibility',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function buildJiraMarkdown(plan: TestPlan): string {
  const { summary } = plan;
  const entw = summary.by_level['ENTW'] ?? 0;
  const intg = summary.by_level['INTG'] ?? 0;
  const entwIntg = summary.by_level['ENTW+INTG'] ?? 0;

  const lines: string[] = [];

  lines.push(`## Testplan — ${plan.story_title}`);
  lines.push(`Generiert: ${formatDate(plan.generated_at)}`);
  lines.push(
    `Gesamt: ${summary.total_count} Testcases | ENTW: ${entw} | INTG: ${intg} | ENTW+INTG: ${entwIntg}`,
  );
  lines.push('');
  lines.push('### AK-Coverage');

  for (const ak of summary.ak_coverage) {
    const check = ak.covered ? '[x]' : '[ ]';
    const uncoveredNote =
      !ak.covered
        ? ' — ⚠️ Nicht vollständig testbar'
        : ` — ${ak.tc_count} TC${ak.tc_count !== 1 ? 's' : ''}`;
    lines.push(`- ${check} ${ak.ak_id}${uncoveredNote}`);
  }

  if (summary.gaps.length > 0) {
    lines.push('');
    lines.push('**Lücken:**');
    for (const gap of summary.gaps) lines.push(`- ${gap}`);
  }

  if (summary.risk_flags.length > 0) {
    lines.push('');
    lines.push('**Risikohinweise:**');
    for (const flag of summary.risk_flags) lines.push(`- ${flag}`);
  }

  for (const tc of plan.test_cases) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`### ${tc.id} — ${tc.title}`);
    lines.push(
      `**Typ:** ${TYPE_LABELS_DE[tc.type] ?? tc.type} | **Stufe:** ${tc.level} | **AK:** ${tc.linked_aks.join(', ') || '—'}`,
    );

    if (tc.flag) {
      lines.push('');
      lines.push(`> ⚠️ **${tc.flag.type === 'open_question' ? 'Offene Frage' : tc.flag.type}:** ${tc.flag.message}`);
    }

    lines.push('');
    lines.push('**Preconditions:**');
    for (const pre of tc.preconditions) lines.push(`- ${pre}`);

    lines.push('');
    lines.push('**Steps:**');
    for (const s of tc.steps) lines.push(`${s.step}. ${s.action}`);

    lines.push('');
    lines.push('**Expected Result:**');
    lines.push(tc.expected_result);
  }

  return lines.join('\n');
}

export function buildSingleTcMarkdown(tc: TestCase): string {
  const lines: string[] = [];

  lines.push(`### ${tc.id} — ${tc.title}`);
  lines.push(
    `**Typ:** ${TYPE_LABELS_DE[tc.type] ?? tc.type} | **Stufe:** ${tc.level} | **AK:** ${tc.linked_aks.join(', ') || '—'}`,
  );

  if (tc.flag) {
    lines.push('');
    lines.push(`> ⚠️ **${tc.flag.type === 'open_question' ? 'Offene Frage' : tc.flag.type}:** ${tc.flag.message}`);
  }

  lines.push('');
  lines.push('**Preconditions:**');
  for (const pre of tc.preconditions) lines.push(`- ${pre}`);

  lines.push('');
  lines.push('**Steps:**');
  for (const s of tc.steps) lines.push(`${s.step}. ${s.action}`);

  lines.push('');
  lines.push('**Expected Result:**');
  lines.push(tc.expected_result);

  return lines.join('\n');
}

// Typ-Hilfsfunktion für die Filter-Logik in den Komponenten
export function getAvailableTypes(testCases: TestCase[]): TestCaseType[] {
  const seen = new Set<TestCaseType>();
  for (const tc of testCases) seen.add(tc.type);
  return Array.from(seen);
}

export function getAvailableLevels(testCases: TestCase[]): TestLevel[] {
  const seen = new Set<TestLevel>();
  for (const tc of testCases) seen.add(tc.level);
  return Array.from(seen);
}
