import { getApiClient, extractTextContent } from '../shared/services/apiClient';
import { withTimeout } from '../shared/services/withTimeout';
import {
  buildEmailPolishPrompt,
  MEETING_POLISH_PROMPT,
  FREETEXT_POLISH_PROMPT,
} from './prompts';
import type { UseCase, Tone } from '../types';

// ─── API call ─────────────────────────────────────────────────────────────────

export async function polishText(
  input: string,
  useCase: UseCase,
  tone: Tone = 'formell',
): Promise<string> {
  const client = getApiClient();

  const systemPrompt =
    useCase === 'email'
      ? buildEmailPolishPrompt(tone)
      : useCase === 'meeting'
        ? MEETING_POLISH_PROMPT
        : FREETEXT_POLISH_PROMPT;

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
