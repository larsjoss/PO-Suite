import type Anthropic from '@anthropic-ai/sdk';
import { getApiClient, extractTextContent } from '../shared/apiClient';
import { withTimeout } from '../shared/withTimeout';
import { buildImageBlock, type ImageInput } from '../shared/imageBlocks';
import { SPRINT_GOAL_SYSTEM_PROMPT, PI_OBJECTIVE_SYSTEM_PROMPT } from './prompts';

export type GoalMode = 'sprint-goal' | 'pi-objective';

export interface SprintGoalInput {
  idea: string;
}

export interface PiObjectiveInput {
  featureTitle: string;
  featureDescription: string;
  jiraReference: string;
  acceptedBy: string;
  acceptanceDate: string;
  acceptanceLevel: string;
}

export interface GoalVariant {
  text: string;
  rationale: string;
  weakness?: string;
}

export type GenerateGoalParams =
  | { mode: 'sprint-goal'; input: SprintGoalInput; screenshot: ImageInput | null }
  | { mode: 'pi-objective'; input: PiObjectiveInput };

export interface GenerateGoalResult {
  variants: GoalVariant[];
  rawText: string;
}

export interface RefineGoalParamsBase {
  rawInitialResponse: string;
  selectedVariantText: string;
  refinementHint: string;
  previousRefinements: Array<{ userMessage: string; rawResult: string }>;
}

export type RefineGoalParams =
  | (RefineGoalParamsBase & { mode: 'sprint-goal'; input: SprintGoalInput; screenshot: ImageInput | null })
  | (RefineGoalParamsBase & { mode: 'pi-objective'; input: PiObjectiveInput });

export interface RefineGoalResult {
  variant: GoalVariant;
  rawText: string;
  userMessage: string;
}

export function parseVariants(raw: string): GoalVariant[] {
  const blocks = raw
    .split(/\n?\*{0,2}Variante\s+\d+\*{0,2}:?\s*\n+/im)
    .map((s) => s.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [{ text: raw.trim(), rationale: '' }];

  return blocks.map(parseVariantBlock).filter((v) => v.text.length > 0);
}

export function parseRefinedVariant(raw: string): GoalVariant {
  return parseVariantBlock(raw.trim());
}

function parseVariantBlock(block: string): GoalVariant {
  const cleaned = block.trim();
  const qIdx = cleaned.search(/\n(?:---\s*\n)?Qualitätsbegründung:/i);
  if (qIdx === -1) {
    return { text: cleaned.replace(/\n\s*---\s*$/, '').trim(), rationale: '' };
  }

  const text = cleaned.slice(0, qIdx).replace(/\n\s*---\s*$/, '').trim();
  const afterQ = cleaned
    .slice(qIdx + 1)
    .replace(/^---\s*\n/, '')
    .replace(/^Qualitätsbegründung:\s*/i, '')
    .trim();

  const sIdx = afterQ.search(/\nSchwachstelle:/i);
  if (sIdx === -1) {
    return { text, rationale: afterQ };
  }

  const rationale = afterQ.slice(0, sIdx).trim();
  const weakness = afterQ.slice(sIdx + 1).replace(/^Schwachstelle:\s*/i, '').trim() || undefined;

  return { text, rationale, weakness };
}

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

function buildOriginalContentBlocks(
  params: GenerateGoalParams | RefineGoalParams,
): Anthropic.Messages.ContentBlockParam[] {
  const userText =
    params.mode === 'sprint-goal'
      ? buildSprintGoalUserText(params.input)
      : buildPiObjectiveUserText(params.input);

  const blocks: Anthropic.Messages.ContentBlockParam[] = [{ type: 'text', text: userText }];

  if (params.mode === 'sprint-goal' && params.screenshot) {
    blocks.push(buildImageBlock(params.screenshot.base64, params.screenshot.mediaType));
  }

  return blocks;
}

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
