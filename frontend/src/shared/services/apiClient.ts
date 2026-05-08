import Anthropic from '@anthropic-ai/sdk';
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { API_KEY_SESSION_KEY } from './storageKeys';

export function getApiClient(): Anthropic {
  const apiKey = sessionStorage.getItem(API_KEY_SESSION_KEY);
  if (!apiKey) throw new Error('Kein API-Key konfiguriert. Bitte einloggen und API-Key eingeben.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function extractTextContent(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
