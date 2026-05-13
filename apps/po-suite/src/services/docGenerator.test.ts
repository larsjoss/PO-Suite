import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StoryDocInput, FeatureDocInput, UploadedFile } from '../types';

// Mock-Hoisting: vi.mock wird vor allen Imports ausgewertet.
const messagesCreateMock = vi.fn();

vi.mock('../shared/services/apiClient', async () => {
  const actual =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await vi.importActual<typeof import('../shared/services/apiClient')>(
      '../shared/services/apiClient',
    );
  return {
    ...actual,
    getApiClient: () => ({
      messages: { create: messagesCreateMock },
    }),
  };
});

import { generateDoc } from './docGenerator';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeStoryInput = (overrides: Partial<StoryDocInput> = {}): StoryDocInput => ({
  title: 'Login mit OAuth',
  description: 'Als Nutzer möchte ich mich via OAuth einloggen.',
  confluenceSpec: '',
  code: '',
  acceptedBy: '',
  deploymentDate: '',
  ...overrides,
});

const makeFeatureInput = (overrides: Partial<FeatureDocInput> = {}): FeatureDocInput => ({
  title: 'Authentifizierungs-Plattform',
  description: 'Zentrale Auth-Plattform für alle internen Tools.',
  stories: 'Login, Logout, Passwort vergessen',
  confluenceSpec: '',
  code: '',
  responsible: '',
  deploymentDate: '',
  ...overrides,
});

const makeScreenshot = (mediaType = 'image/png'): UploadedFile => ({
  id: 'sc-1',
  file: new File(['x'], 'screen.png', { type: mediaType }),
  previewUrl: 'blob:mock',
  base64: 'BASE64DATA',
});

const mockTextResponse = (text: string) => ({
  content: [{ type: 'text', text }],
});

beforeEach(() => {
  messagesCreateMock.mockReset();
});

// ─── Mode-Routing & Modell-Konfiguration ──────────────────────────────────────

describe('generateDoc — mode routing', () => {
  it('verwendet max_tokens 4000 im Story-Modus', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Story-Doku'));

    await generateDoc({ mode: 'story', input: makeStoryInput(), screenshots: [] });

    const args = messagesCreateMock.mock.calls[0][0];
    expect(args.max_tokens).toBe(4000);
    expect(args.model).toBe('claude-sonnet-4-5');
  });

  it('verwendet max_tokens 6000 im Feature-Modus', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Feature-Doku'));

    await generateDoc({ mode: 'feature', input: makeFeatureInput(), screenshots: [] });

    const args = messagesCreateMock.mock.calls[0][0];
    expect(args.max_tokens).toBe(6000);
  });

  it('nutzt unterschiedliche System-Prompts pro Mode', async () => {
    messagesCreateMock.mockResolvedValue(mockTextResponse('# Doku'));

    await generateDoc({ mode: 'story', input: makeStoryInput(), screenshots: [] });
    const storyPrompt = messagesCreateMock.mock.calls[0][0].system as string;

    messagesCreateMock.mockClear();
    await generateDoc({ mode: 'feature', input: makeFeatureInput(), screenshots: [] });
    const featurePrompt = messagesCreateMock.mock.calls[0][0].system as string;

    expect(storyPrompt).toContain('User Stories');
    expect(featurePrompt).toContain('Features');
    expect(storyPrompt).not.toBe(featurePrompt);
  });
});

// ─── User-Message Building ────────────────────────────────────────────────────

describe('generateDoc — Story-Input Mapping', () => {
  it('liefert Pflichtfelder Titel und Beschreibung', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'story',
      input: makeStoryInput({ title: 'Mein Titel', description: 'Meine Beschreibung' }),
      screenshots: [],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('**Titel:** Mein Titel');
    expect(text).toContain('Meine Beschreibung');
  });

  it('lässt leere optionale Felder weg', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'story',
      input: makeStoryInput({ confluenceSpec: '', code: '', acceptedBy: '', deploymentDate: '' }),
      screenshots: [],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).not.toContain('Confluence-Spezifikation');
    expect(text).not.toContain('Code / PR-Beschreibung');
    expect(text).not.toContain('Abnahme durch');
    expect(text).not.toContain('Deployment-Datum');
  });

  it('inkludiert optionale Felder, wenn gesetzt', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'story',
      input: makeStoryInput({
        confluenceSpec: 'CSP-1',
        code: 'PR #42',
        acceptedBy: 'Alice',
        deploymentDate: '2026-05-07',
      }),
      screenshots: [],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('CSP-1');
    expect(text).toContain('PR #42');
    expect(text).toContain('Abnahme durch:** Alice');
    expect(text).toContain('Deployment-Datum:** 2026-05-07');
  });
});

describe('generateDoc — Feature-Input Mapping', () => {
  it('liefert Pflichtfelder inkl. Stories', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'feature',
      input: makeFeatureInput({
        title: 'Auth',
        description: 'Auth-Beschreibung',
        stories: 'Story A, Story B',
      }),
      screenshots: [],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('**Titel:** Auth');
    expect(text).toContain('Auth-Beschreibung');
    expect(text).toContain('Story A, Story B');
  });

  it('inkludiert Verantwortlich und Deployment-Datum, wenn gesetzt', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'feature',
      input: makeFeatureInput({ responsible: 'Bob', deploymentDate: '2026-05-01' }),
      screenshots: [],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('Verantwortlich:** Bob');
    expect(text).toContain('Deployment-Datum:** 2026-05-01');
  });
});

// ─── Multimodal: Screenshots ──────────────────────────────────────────────────

describe('generateDoc — Multimodal', () => {
  it('hängt Screenshots als image-Blocks im Anthropic-Format an', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'story',
      input: makeStoryInput(),
      screenshots: [makeScreenshot('image/png'), makeScreenshot('image/jpeg')],
    });

    const blocks = messagesCreateMock.mock.calls[0][0].messages[0].content;
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe('text');
    expect(blocks[1]).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'BASE64DATA' },
    });
    expect(blocks[2].source.media_type).toBe('image/jpeg');
  });

  it('ergänzt Screenshot-Hinweis im User-Text, wenn Screenshots vorhanden', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({
      mode: 'story',
      input: makeStoryInput(),
      screenshots: [makeScreenshot()],
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('angehängten Screenshots');
  });

  it('lässt Screenshot-Hinweis weg, wenn keine Screenshots vorhanden', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Doku'));

    await generateDoc({ mode: 'story', input: makeStoryInput(), screenshots: [] });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).not.toContain('angehängten Screenshots');
  });
});

// ─── Output & Error Handling ──────────────────────────────────────────────────

describe('generateDoc — Output & Errors', () => {
  it('liefert den Markdown-Text aus der Anthropic-Response zurück', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('# Mein generierter Output'));

    const result = await generateDoc({
      mode: 'story',
      input: makeStoryInput(),
      screenshots: [],
    });

    expect(result).toBe('# Mein generierter Output');
  });

  it('wirft einen Fehler, wenn die Response leeren Text liefert', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('   '));

    await expect(
      generateDoc({ mode: 'story', input: makeStoryInput(), screenshots: [] }),
    ).rejects.toThrow(/nicht generiert/i);
  });

  it('reicht API-Fehler durch', async () => {
    messagesCreateMock.mockRejectedValueOnce(new Error('Network unreachable'));

    await expect(
      generateDoc({ mode: 'story', input: makeStoryInput(), screenshots: [] }),
    ).rejects.toThrow('Network unreachable');
  });
});
