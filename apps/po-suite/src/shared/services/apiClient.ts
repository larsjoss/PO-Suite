import Anthropic from '@anthropic-ai/sdk';
import type { TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { API_KEY_SESSION_KEY } from './storageKeys';

let _client: Anthropic | null = null;
let _clientKey: string | null = null;

/**
 * Gibt einen gecachten Anthropic-Client zurück.
 * Liest den API-Key aus sessionStorage — nie aus localStorage oder einer anderen Quelle.
 * Erstellt einen neuen Client wenn der Key sich seit dem letzten Aufruf geändert hat.
 * Wirft wenn kein Key gesetzt oder der Key leer ist.
 */
export function getApiClient(): Anthropic {
  const apiKey = sessionStorage.getItem(API_KEY_SESSION_KEY);
  if (!apiKey) throw new Error('Kein API-Key konfiguriert. Bitte einloggen und API-Key eingeben.');
  if (_client && _clientKey === apiKey) return _client;
  _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  _clientKey = apiKey;
  return _client;
}

/**
 * Extrahiert den verketteten Text aus einem Anthropic-Response-Content-Array.
 * Nicht-Text-Blöcke (image, tool_use, etc.) werden ignoriert.
 * Gibt einen leeren String zurück wenn keine Text-Blöcke vorhanden sind.
 */
export function extractTextContent(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
