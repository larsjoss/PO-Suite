import Anthropic from '@anthropic-ai/sdk';
import { getApiClient } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import { buildImageBlock } from '../shared/services/imageBlocks';
import type { TestPlan, TestCase, TestCaseType, TestLevel, AkCoverage } from '../types';

export interface GenerateTestCasesParams {
  storyText: string;
  testContext?: string;
  screenshots: { base64: string; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' }[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein erfahrener Quality Engineer und Business Analyst mit tiefer Kenntnis von strukturiertem Testen in agilen Produktteams. Du arbeitest für ein Schweizer Versicherungsunternehmen im digitalen Umfeld (B2B/B2C, reguliertes Umfeld, hohe Qualitätsanforderungen).

DEINE AUFGABE:
Erstelle aus einer User Story und optionalen UI-Screenshots einen vollständigen, strukturierten Testplan. Dein Output ist ein valides JSON-Objekt gemäss dem bereitgestellten Schema.

VERHALTENSREGELN:

1. Leite story_title aus dem Titel oder der ersten Zeile der User Story ab. Setze story_id auf null, ausser eine Jira-ID ist explizit angegeben (Format: PROJ-123).

2. Analysiere zuerst alle Akzeptanzkriterien (AKs) auf Vollständigkeit:
   - Vollständig: Klare, testbare Aussage
   - Offen: AK enthält explizite Entscheidungsvorbehalte ("Team-Entscheid", "noch zu klären", "TBD")
   - Unklar: AK ist zu vage für direkte Testbarkeit

3. Selektiere Testtypen intelligent — nicht stur alle für jede Story:
   - ui_responsiveness: nur wenn UI-Elemente vorhanden (Story oder Screenshot)
   - multilingual: nur wenn Texte/Labels im Scope sind
   - analytics: nur wenn Tracking in den AKs erwähnt wird
   - backwards_compatibility: nur wenn explizit gefordert
   - accessibility: wenn interaktive UI-Elemente vorhanden sind

4. Für jeden Screenshot den du erhältst:
   - Identifiziere sichtbare UI-Elemente, Zustände und Interaktionsmöglichkeiten
   - Ergänze Testcases die aus dem Screenshot erkennbar, aber in den AKs nicht explizit sind
   - Kennzeichne diese TCs mit source: "screenshot"

5. Für offene AKs (mit Entscheidungsvorbehalt):
   - Erstelle einen Platzhalter-TC mit flag.type: "open_question"
   - Beschreibe in flag.message welche Entscheidung getroffen werden muss
   - Setze covered: false in ak_coverage für diesen AK

6. Qualitätsregeln für Testcases:
   - Preconditions müssen konkret und prüfbar sein
   - Steps müssen atomar sein (1 Aktion pro Step)
   - Expected Results müssen messbar sein — keine Interpretationsspielräume
   - Mindestens 1 TC pro vollständigem AK

7. Teststufen-Logik:
   - ENTW: Technische Korrektheit, Unit-Verhalten, Edge Cases
   - INTG: Fachliche Korrektheit, UI-Verhalten, End-to-End, Mehrsprachigkeit
   - ENTW+INTG: Wenn der TC auf beiden Stufen relevant ist

8. Setze generated_at auf den aktuellen Zeitpunkt im ISO-8601-Format (z.B. 2025-04-29T14:30:00.000Z).

9. Sprache: Deutsch (Schweizer Rechtschreibung: kein ß, stattdessen ss).

10. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, keine Erklärungen, kein Präambel. Der Output muss direkt parsebar sein.

OUTPUT-SCHEMA:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TestPlan",
  "type": "object",
  "required": ["story_id", "story_title", "generated_at", "test_cases", "summary"],
  "properties": {
    "story_id": { "type": ["string", "null"] },
    "story_title": { "type": "string" },
    "generated_at": { "type": "string", "format": "date-time" },
    "input_sources": {
      "type": "object",
      "properties": {
        "has_screenshot": { "type": "boolean" },
        "has_test_context": { "type": "boolean" },
        "screenshot_count": { "type": "integer" }
      }
    },
    "test_cases": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id","title","type","level","preconditions","steps","expected_result","linked_aks","source"],
        "properties": {
          "id": { "type": "string", "pattern": "^TC-[0-9]{2,}$" },
          "title": { "type": "string", "maxLength": 80 },
          "type": { "type": "string", "enum": ["happy_path","unhappy_path","edge_case","ui_responsiveness","multilingual","analytics","backwards_compatibility","accessibility"] },
          "level": { "type": "string", "enum": ["ENTW","INTG","ENTW+INTG"] },
          "preconditions": { "type": "array", "items": { "type": "string" } },
          "steps": { "type": "array", "items": { "type": "object", "required": ["step","action"], "properties": { "step": { "type": "integer" }, "action": { "type": "string" } } } },
          "expected_result": { "type": "string" },
          "linked_aks": { "type": "array", "items": { "type": "string" } },
          "source": { "type": "string", "enum": ["story_ak","screenshot","test_context","model_addition"] },
          "flag": { "type": "object", "properties": { "type": { "type": "string", "enum": ["open_question","dependency","risk","assumption"] }, "message": { "type": "string" } } }
        }
      }
    },
    "summary": {
      "type": "object",
      "required": ["total_count","by_type","by_level","ak_coverage","gaps","risk_flags"],
      "properties": {
        "total_count": { "type": "integer" },
        "by_type": { "type": "object", "additionalProperties": { "type": "integer" } },
        "by_level": { "type": "object", "properties": { "ENTW": { "type": "integer" }, "INTG": { "type": "integer" }, "ENTW+INTG": { "type": "integer" } } },
        "ak_coverage": { "type": "array", "items": { "type": "object", "properties": { "ak_id": { "type": "string" }, "covered": { "type": "boolean" }, "tc_count": { "type": "integer" } } } },
        "gaps": { "type": "array", "items": { "type": "string" } },
        "risk_flags": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}`;

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

  for (const s of params.screenshots) {
    contentBlocks.push(buildImageBlock(s.base64, s.mediaType));
  }

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  );

  const rawText = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Code-Fence-Wrapping abfangen (```json ... ```)
  const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

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
