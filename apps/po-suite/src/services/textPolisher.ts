import { getApiClient, extractTextContent } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import {
  buildEmailPolishPrompt,
  MEETING_POLISH_PROMPT,
  FREETEXT_POLISH_PROMPT,
} from './prompts/textPolisher';
import type { UseCase, Tone } from '../types';

// ─── API call ─────────────────────────────────────────────────────────────────

function withTeamContext(systemPrompt: string, teamContext: string): string {
  if (!teamContext.trim()) return systemPrompt;
  return `## Team-Kontext des Nutzers\n${teamContext}\n\n${systemPrompt}`;
}

export async function polishText(
  input: string,
  useCase: UseCase,
  tone: Tone = 'formell',
  teamContext = '',
): Promise<string> {
  const client = getApiClient();

  const basePrompt =
    useCase === 'email'
      ? buildEmailPolishPrompt(tone)
      : useCase === 'meeting'
        ? MEETING_POLISH_PROMPT
        : FREETEXT_POLISH_PROMPT;
  const systemPrompt = withTeamContext(basePrompt, teamContext);

  const response = await withTimeout(
    client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: input }],
    }),
  );

  const text = extractTextContent(response.content);

  if (useCase === 'email' && !text.trimStart().startsWith('Betreff:')) {
    throw new Error(
      'Unerwartetes E-Mail-Format: Antwort beginnt nicht mit "Betreff:". Bitte erneut versuchen.',
    );
  }

  return text;
}
