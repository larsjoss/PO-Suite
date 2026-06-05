import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages';
import { API_KEY_SESSION_KEY } from './storageKeys';

let constructorCallCount = 0;
let lastConstructorArgs: unknown;

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: vi.fn() };
    constructor(args: unknown) {
      constructorCallCount++;
      lastConstructorArgs = args;
    }
  }
  return { default: MockAnthropic };
});

import { getApiClient, extractTextContent } from './apiClient';

beforeEach(() => {
  sessionStorage.clear();
  constructorCallCount = 0;
  lastConstructorArgs = undefined;
});

describe('getApiClient — Sicherheitsvalidierung', () => {
  it('wirft wenn kein API-Key in sessionStorage', () => {
    expect(() => getApiClient()).toThrow('Kein API-Key konfiguriert');
  });

  it('wirft wenn API-Key leer ist', () => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, '');
    expect(() => getApiClient()).toThrow('Kein API-Key konfiguriert');
  });

  it('gibt Client zurück wenn API-Key vorhanden', () => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, 'sk-ant-test-key');
    const client = getApiClient();
    expect(client).toBeDefined();
    expect(constructorCallCount).toBe(1);
    expect(lastConstructorArgs).toEqual({ apiKey: 'sk-ant-test-key', dangerouslyAllowBrowser: true });
  });

  it('gibt gecachten Client zurück bei gleichem Key (kein zweiter SDK-Init)', () => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, 'sk-ant-same-key');
    getApiClient();
    getApiClient();
    expect(constructorCallCount).toBe(1);
  });

  it('erstellt neuen Client wenn Key sich ändert', () => {
    sessionStorage.setItem(API_KEY_SESSION_KEY, 'sk-ant-key-1');
    getApiClient();
    sessionStorage.setItem(API_KEY_SESSION_KEY, 'sk-ant-key-2');
    getApiClient();
    expect(constructorCallCount).toBe(2);
  });

  it('liest Key aus sessionStorage — NICHT aus localStorage', () => {
    localStorage.setItem(API_KEY_SESSION_KEY, 'sk-ant-in-localstorage');
    expect(() => getApiClient()).toThrow('Kein API-Key konfiguriert');
  });

  it('liest Key aus sessionStorage — NICHT aus anderen Keys', () => {
    sessionStorage.setItem('po_api_key', 'sk-ant-wrong-key');
    sessionStorage.setItem('api_key', 'sk-ant-wrong-key');
    expect(() => getApiClient()).toThrow('Kein API-Key konfiguriert');
  });
});

describe('extractTextContent', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const block = (obj: any) => obj as ContentBlock;

  it('extrahiert Text aus TextBlock', () => {
    const content = [block({ type: 'text', text: 'Hallo Welt' })];
    expect(extractTextContent(content)).toBe('Hallo Welt');
  });

  it('verbindet mehrere TextBlocks', () => {
    const content = [block({ type: 'text', text: 'Teil 1' }), block({ type: 'text', text: ' Teil 2' })];
    expect(extractTextContent(content)).toBe('Teil 1 Teil 2');
  });

  it('ignoriert Nicht-Text-Blöcke (z.B. image)', () => {
    const content = [
      block({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'abc' } }),
      block({ type: 'text', text: 'Nur Text' }),
    ];
    expect(extractTextContent(content)).toBe('Nur Text');
  });

  it('gibt leeren String zurück bei leerem Array', () => {
    expect(extractTextContent([])).toBe('');
  });
});
