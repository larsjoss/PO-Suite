import { getApiClient, extractTextContent } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import { buildSystemPrompt } from '../shared/services/promptUtils';
import { STORY_GENERATOR_SYSTEM_PROMPT as SYSTEM_PROMPT } from './prompts/story';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HintAnswer {
  hint: string;
  answer: string;
}

/**
 * Applies visual Markdown formatting to story output at render time.
 * The stored rawStory is never mutated — formatting is purely cosmetic.
 *
 * Transforms:
 * 1. Standalone bold headers `**Foo**` → `**Foo:**`
 * 2. Title line `**Titel** — text` → `**Titel:** — text`
 * 3. AK list items `- AK-1: text` → `- **AK-1:** text`
 */
export function formatStoryMarkdown(raw: string): string {
  return raw
    .replace(/^(\*\*[^*\n]+?)\*\*(\s*—)/gm, '$1:**$2')
    .replace(/^\*\*([^*\n]+?)(?<!:)\*\*\s*$/gm, '**$1:**')
    .replace(/^([ \t]*[-*][ \t]+)(AK-\d+):/gm, '$1**$2:**');
}

/**
 * Splits the raw API response into story body and refinement hints.
 * The model appends a `**Refinement Hinweise**` section at the end — this function
 * separates it so story and hints can be stored and displayed independently.
 * Returns empty hints string if no section is present.
 */
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
  teamContext = '',
  workspaceContext = '',
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: buildSystemPrompt(SYSTEM_PROMPT, teamContext, workspaceContext),
      messages: [{ role: 'user', content: rawInput }],
    }),
  );
  return parseOutput(extractTextContent(response.content));
}

export async function refineStoryWithHints(
  currentStory: string,
  hintAnswers: HintAnswer[],
  teamContext = '',
  workspaceContext = '',
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const pairs = hintAnswers
    .map(({ hint, answer }) => `[Hinweis]: ${hint}\n[Antwort]: ${answer}`)
    .join('\n\n');
  const userMessage =
    `Hier ist die aktuelle Story:\n\n${currentStory}\n\n` +
    `Bitte überarbeite die Story auf Basis der folgenden beantworteten Refinement-Hinweise. ` +
    `Behalte das bestehende Output-Template exakt bei.\n\nBeantwortete Hinweise:\n${pairs}`;
  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: buildSystemPrompt(SYSTEM_PROMPT, teamContext, workspaceContext),
      messages: [{ role: 'user', content: userMessage }],
    }),
  );
  return parseOutput(extractTextContent(response.content));
}

/**
 * Reconstructs the full conversation history for a story refinement turn.
 * Produces an alternating user/assistant sequence that the model sees as a continuation
 * of the original generation session, enabling coherent in-context refinements.
 *
 * Structure: [original input → original story] → [refinement 1 → result 1] → … → [instruction]
 * An empty story (rawInput = '') still produces a valid 3-message history so the caller
 * never needs to check for edge cases.
 */
export function buildStoryConversationHistory(
  story: { rawInput: string; generatedStory: string; refinementHints: string },
  refinements: Array<{ instruction: string; resultStory: string }>,
  instruction: string,
): ConversationMessage[] {
  const assistantContent =
    story.generatedStory +
    (story.refinementHints ? '\n\n**Refinement Hinweise**\n' + story.refinementHints : '');
  return [
    { role: 'user', content: story.rawInput },
    { role: 'assistant', content: assistantContent },
    ...refinements.flatMap((r) => [
      { role: 'user' as const, content: r.instruction },
      { role: 'assistant' as const, content: r.resultStory },
    ]),
    { role: 'user', content: instruction },
  ];
}

export async function refineStory(
  conversationHistory: ConversationMessage[],
  teamContext = '',
  workspaceContext = '',
): Promise<{ generatedStory: string; refinementHints: string }> {
  const client = getApiClient();
  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: buildSystemPrompt(SYSTEM_PROMPT, teamContext, workspaceContext),
      messages: conversationHistory,
    }),
  );
  return parseOutput(extractTextContent(response.content));
}
