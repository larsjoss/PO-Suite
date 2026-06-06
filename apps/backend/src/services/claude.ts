import { getApiClient, extractTextContent } from '../shared/apiClient';
import { STORY_GENERATOR_SYSTEM_PROMPT as SYSTEM_PROMPT } from './prompts';
import type { ConversationMessage, HintAnswer } from '@po-suite/api-types';
export type { ConversationMessage, HintAnswer };

export function parseOutput(text: string): { generatedStory: string; refinementHints: string } {
  const parts = text.split(/^\*\*Refinement Hinweise\*\*/m);
  if (parts.length >= 2) {
    return {
      generatedStory: parts[0].trim(),
      refinementHints: parts.slice(1).join('**Refinement Hinweise**').trim(),
    };
  }
  return { generatedStory: text.trim(), refinementHints: '' };
}

export function extractTitle(generatedStory: string, fallback: string): string {
  const match = /^\*\*Titel\*\*\s*[—–-]\s*(.+)$/m.exec(generatedStory);
  return match ? match[1].trim() : fallback.slice(0, 60);
}

export async function generateStory(
  rawInput: string,
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: rawInput }],
  });
  return parseOutput(extractTextContent(response.content));
}

export async function refineStoryWithHints(
  currentStory: string,
  hintAnswers: HintAnswer[],
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const pairs = hintAnswers
    .map(({ hint, answer }) => `[Hinweis]: ${hint}\n[Antwort]: ${answer}`)
    .join('\n\n');
  const userMessage =
    `Hier ist die aktuelle Story:\n\n${currentStory}\n\n` +
    `Bitte überarbeite die Story auf Basis der folgenden beantworteten Refinement-Hinweise. ` +
    `Behalte das bestehende Output-Template exakt bei.\n\nBeantwortete Hinweise:\n${pairs}`;
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });
  return parseOutput(extractTextContent(response.content));
}

export async function refineStory(
  conversationHistory: ConversationMessage[],
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: conversationHistory,
  });
  return parseOutput(extractTextContent(response.content));
}
