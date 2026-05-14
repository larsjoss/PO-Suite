import type Anthropic from '@anthropic-ai/sdk';
import { getApiClient, extractTextContent } from '../shared/apiClient';
import { withTimeout } from '../shared/withTimeout';
import { buildImageBlocks, type ImageInput } from '../shared/imageBlocks';
import { STORY_DOC_SYSTEM_PROMPT, FEATURE_DOC_SYSTEM_PROMPT } from './prompts';

export type DocMode = 'story' | 'feature';

export interface StoryDocInput {
  title: string;
  description: string;
  confluenceSpec: string;
  code: string;
  acceptedBy: string;
  deploymentDate: string;
}

export interface FeatureDocInput {
  title: string;
  description: string;
  stories: string;
  confluenceSpec: string;
  code: string;
  responsible: string;
  deploymentDate: string;
}

export type GenerateDocParams =
  | { mode: 'story'; input: StoryDocInput; screenshots: ImageInput[] }
  | { mode: 'feature'; input: FeatureDocInput; screenshots: ImageInput[] };

function buildStoryText(input: StoryDocInput): string {
  const lines: string[] = [];
  lines.push(`**Titel:** ${input.title}`);
  lines.push('');
  lines.push(`**Story-Beschreibung / Akzeptanzkriterien:**\n${input.description}`);
  if (input.confluenceSpec.trim()) {
    lines.push('');
    lines.push(`**Confluence-Spezifikation:**\n${input.confluenceSpec.trim()}`);
  }
  if (input.code.trim()) {
    lines.push('');
    lines.push(`**Code / PR-Beschreibung:**\n${input.code.trim()}`);
  }
  if (input.acceptedBy.trim()) {
    lines.push('');
    lines.push(`**Abnahme durch:** ${input.acceptedBy.trim()}`);
  }
  if (input.deploymentDate.trim()) {
    lines.push('');
    lines.push(`**Deployment-Datum:** ${input.deploymentDate.trim()}`);
  }
  return lines.join('\n');
}

function buildFeatureText(input: FeatureDocInput): string {
  const lines: string[] = [];
  lines.push(`**Titel:** ${input.title}`);
  lines.push('');
  lines.push(`**Feature-Beschreibung:**\n${input.description}`);
  lines.push('');
  lines.push(`**Enthaltene Stories:**\n${input.stories}`);
  if (input.confluenceSpec.trim()) {
    lines.push('');
    lines.push(`**Confluence-Spezifikation:**\n${input.confluenceSpec.trim()}`);
  }
  if (input.code.trim()) {
    lines.push('');
    lines.push(`**Code / Architekturnotizen:**\n${input.code.trim()}`);
  }
  if (input.responsible.trim()) {
    lines.push('');
    lines.push(`**Verantwortlich:** ${input.responsible.trim()}`);
  }
  if (input.deploymentDate.trim()) {
    lines.push('');
    lines.push(`**Deployment-Datum:** ${input.deploymentDate.trim()}`);
  }
  return lines.join('\n');
}

export async function generateDoc(params: GenerateDocParams): Promise<string> {
  const client = getApiClient();

  const systemPrompt = params.mode === 'story' ? STORY_DOC_SYSTEM_PROMPT : FEATURE_DOC_SYSTEM_PROMPT;
  const maxTokens = params.mode === 'story' ? 4000 : 6000;

  const userText =
    params.mode === 'story'
      ? buildStoryText(params.input)
      : buildFeatureText(params.input);

  const hasScreenshots = params.screenshots.length > 0;
  const textWithHint = hasScreenshots
    ? `${userText}\n\nDie angehängten Screenshots zeigen das entwickelte UI. Nutze sie als zusätzlichen Kontext für die Dokumentation.`
    : userText;

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [
    { type: 'text', text: textWithHint },
    ...buildImageBlocks(params.screenshots),
  ];

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  );

  const markdown = extractTextContent(response.content);

  if (!markdown.trim()) {
    throw new Error('Die Dokumentation konnte nicht generiert werden. Bitte erneut versuchen.');
  }

  return markdown;
}
