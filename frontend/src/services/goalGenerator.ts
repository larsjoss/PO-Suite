import Anthropic from '@anthropic-ai/sdk';
import { getApiClient, extractTextContent } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import { uploadedFileToImageBlock } from '../shared/services/imageBlocks';
import { SPRINT_GOAL_SYSTEM_PROMPT, PI_OBJECTIVE_SYSTEM_PROMPT } from './prompts';
import type {
  GoalVariant,
  GenerateGoalParams,
  GenerateGoalResult,
  RefineGoalParams,
  RefineGoalResult,
  SprintGoalInput,
  PiObjectiveInput,
} from '../types';

// ─── Output-Parser ────────────────────────────────────────────────────────────

export function parseVariants(raw: string): GoalVariant[] {
  // Aufteilen auf "Variante N" Header — mit oder ohne ** Markdown
  const blocks = raw
    .split(/\n?\*{0,2}Variante\s+\d+\*{0,2}:?\s*\n+/im)
    .map((s) => s.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [{ text: raw.trim(), rationale: '' }];

  return blocks.map(parseVariantBlock).filter((v) => v.text.length > 0);
}

// Auch als Export für Refinement-Responses ohne "Variante N" Header
export function parseRefinedVariant(raw: string): GoalVariant {
  return parseVariantBlock(raw.trim());
}

function parseVariantBlock(block: string): GoalVariant {
  const cleaned = block.trim();

  // Trennstelle suchen: optional vorangestelltes "---" vor "Qualitätsbegründung:"
  // Abdeckt Sprint Goal (kein ---) und PI Objective (--- als Trenner)
  const qIdx = cleaned.search(/\n(?:---\s*\n)?Qualitätsbegründung:/i);
  if (qIdx === -1) {
    // Kein Separator gefunden — trailing --- entfernen (PI Objective ohne Qualitätsbegründung)
    return { text: cleaned.replace(/\n\s*---\s*$/, '').trim(), rationale: '' };
  }

  // Text = alles vor dem Separator, trailing --- entfernen
  const text = cleaned.slice(0, qIdx).replace(/\n\s*---\s*$/, '').trim();

  // Rest: optionalen --- Trenner und "Qualitätsbegründung:" Label abstreifen
  const afterQ = cleaned
    .slice(qIdx + 1)           // '+1' überspringt das führende \n
    .replace(/^---\s*\n/, '')  // optionalen --- Trenner entfernen
    .replace(/^Qualitätsbegründung:\s*/i, '')
    .trim();

  // Trennstelle "Schwachstelle:" finden
  const sIdx = afterQ.search(/\nSchwachstelle:/i);
  if (sIdx === -1) {
    return { text, rationale: afterQ };
  }

  const rationale = afterQ.slice(0, sIdx).trim();
  const weakness = afterQ.slice(sIdx + 1).replace(/^Schwachstelle:\s*/i, '').trim() || undefined;

  return { text, rationale, weakness };
}

// ─── User-Message-Builder ─────────────────────────────────────────────────────

function buildSprintGoalUserText(input: SprintGoalInput): string {
  return `Sprint Goal Idee:\n${input.idea}`;
}

function buildPiObjectiveUserText(input: PiObjectiveInput): string {
  const lines: string[] = [];
  lines.push(`**ART-Feature Titel:** ${input.featureTitle}`);
  lines.push('');
  lines.push(`**ART-Feature Beschreibung:**\n${input.featureDescription}`);
  if (input.jiraReference.trim()) {
    lines.push('');
    lines.push(`**Jira-Referenz:** ${input.jiraReference.trim()}`);
  }
  if (input.acceptedBy.trim()) {
    lines.push('');
    lines.push(`**Abnahme durch:** ${input.acceptedBy.trim()}`);
  }
  if (input.acceptanceDate.trim()) {
    lines.push('');
    lines.push(`**Abnahme-Datum:** ${input.acceptanceDate.trim()}`);
  }
  if (input.acceptanceLevel.trim()) {
    lines.push('');
    lines.push(`**Abnahme-Stufe:** ${input.acceptanceLevel.trim()}`);
  }
  return lines.join('\n');
}

function buildRefinementInstruction(selectedVariantText: string, hint: string): string {
  return (
    `Bitte verfeinere die folgende Variante basierend auf diesem Hinweis: "${hint}"\n\n` +
    `Ausgewählte Variante:\n${selectedVariantText}\n\n` +
    `Liefere eine einzelne überarbeitete Variante in der gleichen Struktur. ` +
    `Kein "Variante N" Header.`
  );
}

// ─── Hilfsfunktion: ContentBlocks für einen User-Turn ────────────────────────

function buildOriginalContentBlocks(
  params: GenerateGoalParams | RefineGoalParams,
): Anthropic.Messages.ContentBlockParam[] {
  const userText =
    params.mode === 'sprint-goal'
      ? buildSprintGoalUserText(params.input)
      : buildPiObjectiveUserText(params.input);

  const blocks: Anthropic.Messages.ContentBlockParam[] = [{ type: 'text', text: userText }];

  if (params.mode === 'sprint-goal' && params.screenshot) {
    blocks.push(uploadedFileToImageBlock(params.screenshot));
  }

  return blocks;
}

// ─── API-Calls ────────────────────────────────────────────────────────────────

export async function generateGoals(params: GenerateGoalParams): Promise<GenerateGoalResult> {
  const client = getApiClient();

  const systemPrompt =
    params.mode === 'sprint-goal' ? SPRINT_GOAL_SYSTEM_PROMPT : PI_OBJECTIVE_SYSTEM_PROMPT;
  const maxTokens = params.mode === 'sprint-goal' ? 2000 : 6000;

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: buildOriginalContentBlocks(params) }],
    }),
  );
  const rawText = extractTextContent(response.content);

  if (!rawText.trim()) {
    throw new Error('Es konnten keine Varianten generiert werden. Bitte erneut versuchen.');
  }

  return { variants: parseVariants(rawText), rawText };
}

export async function refineGoal(params: RefineGoalParams): Promise<RefineGoalResult> {
  const client = getApiClient();

  const systemPrompt =
    params.mode === 'sprint-goal' ? SPRINT_GOAL_SYSTEM_PROMPT : PI_OBJECTIVE_SYSTEM_PROMPT;
  const maxTokens = params.mode === 'sprint-goal' ? 1000 : 2000;

  const userMessage = buildRefinementInstruction(params.selectedVariantText, params.refinementHint);

  // Conversation-History aufbauen — identisches Pattern wie refineStory() im Story Generator
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: buildOriginalContentBlocks(params) },
    { role: 'assistant', content: params.rawInitialResponse },
    ...params.previousRefinements.flatMap((r) => [
      { role: 'user' as const, content: r.userMessage },
      { role: 'assistant' as const, content: r.rawResult },
    ]),
    { role: 'user', content: userMessage },
  ];

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  );
  const rawText = extractTextContent(response.content);

  if (!rawText.trim()) {
    throw new Error('Die Verfeinerung konnte nicht generiert werden. Bitte erneut versuchen.');
  }

  return { variant: parseRefinedVariant(rawText), rawText, userMessage };
}
