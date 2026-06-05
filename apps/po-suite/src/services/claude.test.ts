import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseOutput, extractTitle, formatStoryMarkdown } from './claude';

// ─── Mocks für API-Calls ──────────────────────────────────────────────────────

const messagesCreateMock = vi.fn();
vi.mock('../shared/services/apiClient', () => ({
  getApiClient: () => ({ messages: { create: messagesCreateMock } }),
  extractTextContent: (content: Array<{ type: string; text?: string }>) =>
    content.filter((b) => b.type === 'text').map((b) => b.text).join(''),
}));
vi.mock('../shared/services/withTimeout', () => ({
  withTimeout: (p: Promise<unknown>) => p,
}));
vi.mock('../shared/services/promptUtils', () => ({
  buildSystemPrompt: (_tool: string, team: string, ws: string) =>
    [team, ws, _tool].filter(Boolean).join('\n\n'),
}));

beforeEach(() => {
  messagesCreateMock.mockReset();
});

describe('parseOutput', () => {
  it('splits story and hints at the Refinement Hinweise heading', () => {
    const raw = `**Titel** — Mein Feature

**Ausgangslage**
Beschreibung des Problems.

**Refinement Hinweise**
- **KRITISCH:** Klärung nötig.`;

    const result = parseOutput(raw);

    expect(result.generatedStory).toBe(
      '**Titel** — Mein Feature\n\n**Ausgangslage**\nBeschreibung des Problems.',
    );
    expect(result.refinementHints).toBe('- **KRITISCH:** Klärung nötig.');
  });

  it('returns empty hints when no Refinement Hinweise section present', () => {
    const raw = '**Titel** — Ohne Hinweise\n\n**Ausgangslage**\nText.';
    const result = parseOutput(raw);
    expect(result.generatedStory).toBe(raw.trim());
    expect(result.refinementHints).toBe('');
  });

  it('trims whitespace from both parts', () => {
    const raw = '  Story-Text  \n\n**Refinement Hinweise**\n  Hinweis  ';
    const result = parseOutput(raw);
    expect(result.generatedStory).toBe('Story-Text');
    expect(result.refinementHints).toBe('Hinweis');
  });

  it('handles multiple occurrences by joining the tail back', () => {
    const raw =
      'Teil 1\n\n**Refinement Hinweise**\nErster Block\n\n**Refinement Hinweise**\nZweiter Block';
    const result = parseOutput(raw);
    expect(result.generatedStory).toBe('Teil 1');
    expect(result.refinementHints).toContain('Erster Block');
    expect(result.refinementHints).toContain('Zweiter Block');
  });
});

describe('extractTitle', () => {
  it('extracts title after em dash', () => {
    const story = '**Titel** — Mein Super Feature\n\nRest des Textes.';
    expect(extractTitle(story, 'fallback')).toBe('Mein Super Feature');
  });

  it('extracts title after en dash', () => {
    const story = '**Titel** – Anderer Titel';
    expect(extractTitle(story, 'fallback')).toBe('Anderer Titel');
  });

  it('extracts title after ASCII hyphen', () => {
    const story = '**Titel** - Einfacher Titel';
    expect(extractTitle(story, 'fallback')).toBe('Einfacher Titel');
  });

  it('returns truncated fallback when no title line present', () => {
    const story = 'Kein Titel in diesem Text.';
    const fallback = 'a'.repeat(80);
    expect(extractTitle(story, fallback)).toBe('a'.repeat(60));
  });

  it('returns full fallback when it is shorter than 60 chars', () => {
    const story = 'Kein Titel.';
    expect(extractTitle(story, 'kurz')).toBe('kurz');
  });

  it('trims whitespace from extracted title', () => {
    const story = '**Titel** —   Titel mit Leerzeichen   ';
    expect(extractTitle(story, 'fb')).toBe('Titel mit Leerzeichen');
  });
});

describe('formatStoryMarkdown', () => {
  it('adds colon to standalone bold headers', () => {
    expect(formatStoryMarkdown('**Ausgangslage**')).toBe('**Ausgangslage:**');
  });

  it('does not double-colon an already-colon header', () => {
    expect(formatStoryMarkdown('**Ausgangslage:**')).toBe('**Ausgangslage:**');
  });

  it('preserves em dash in title line and adds colon', () => {
    const input = '**Titel** — Mein Feature';
    expect(formatStoryMarkdown(input)).toBe('**Titel:** — Mein Feature');
  });

  it('bolds AK identifiers in list items', () => {
    const input = '- AK-1: Erster Test';
    expect(formatStoryMarkdown(input)).toBe('- **AK-1:** Erster Test');
  });

  it('bolds AK identifiers with multi-digit numbers', () => {
    const input = '- AK-12: Zwölfter Test';
    expect(formatStoryMarkdown(input)).toBe('- **AK-12:** Zwölfter Test');
  });

  it('does not modify plain text lines', () => {
    const input = 'Normaler Fliesstext ohne Markdown.';
    expect(formatStoryMarkdown(input)).toBe(input);
  });
});

// ─── buildStoryConversationHistory ───────────────────────────────────────────

import { buildStoryConversationHistory } from './claude';

describe('buildStoryConversationHistory', () => {
  const story = {
    rawInput: 'Nutzereingabe',
    generatedStory: 'Generierte Story',
    refinementHints: 'Hinweis A',
  };

  it('erzeugt user/assistant-Turn aus story + abschliessendem instruction-Turn', () => {
    const history = buildStoryConversationHistory(story, [], 'Bitte kürzer');
    expect(history[0]).toEqual({ role: 'user', content: 'Nutzereingabe' });
    expect(history[1].role).toBe('assistant');
    expect(history[1].content).toContain('Generierte Story');
    expect(history[1].content).toContain('Hinweis A');
    expect(history[history.length - 1]).toEqual({ role: 'user', content: 'Bitte kürzer' });
  });

  it('enthält keine Refinement-Hinweise-Sektion wenn leer', () => {
    const storyNoHints = { ...story, refinementHints: '' };
    const history = buildStoryConversationHistory(storyNoHints, [], 'Instruction');
    expect(history[1].content).not.toContain('Refinement Hinweise');
  });

  it('fügt Refinement-Logs korrekt als user/assistant-Paare ein', () => {
    const refinements = [
      { instruction: 'Erste Verfeinerung', resultStory: 'Erstes Ergebnis' },
      { instruction: 'Zweite Verfeinerung', resultStory: 'Zweites Ergebnis' },
    ];
    const history = buildStoryConversationHistory(story, refinements, 'Dritte Verfeinerung');
    expect(history).toHaveLength(7); // user + assistant + 2×(user+assistant) + user
    expect(history[2]).toEqual({ role: 'user', content: 'Erste Verfeinerung' });
    expect(history[3]).toEqual({ role: 'assistant', content: 'Erstes Ergebnis' });
    expect(history[history.length - 1]).toEqual({ role: 'user', content: 'Dritte Verfeinerung' });
  });

  it('gibt nur instruction-Turn zurück wenn keine Story-Daten (leere history)', () => {
    const history = buildStoryConversationHistory(
      { rawInput: '', generatedStory: '', refinementHints: '' },
      [],
      'Instruction',
    );
    expect(history).toHaveLength(3);
  });
});

// ─── generateStory ────────────────────────────────────────────────────────────

import { generateStory, refineStoryWithHints, refineStory } from './claude';

describe('generateStory', () => {
  it('ruft messages.create auf und gibt Story + Hints zurück', async () => {
    messagesCreateMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '**Titel** — Feature\n\n**Refinement Hinweise**\n- Hinweis' }],
    });

    const result = await generateStory('Anforderung');
    expect(result.generatedStory).toContain('**Titel**');
    expect(result.refinementHints).toContain('Hinweis');
    expect(messagesCreateMock).toHaveBeenCalledOnce();
  });

  it('übergibt teamContext und workspaceContext an buildSystemPrompt', async () => {
    messagesCreateMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Story ohne Hinweise' }] });

    await generateStory('Eingabe', 'Team XY', 'Workspace Z');
    const call = messagesCreateMock.mock.calls[0][0];
    expect(call.system).toContain('Team XY');
    expect(call.system).toContain('Workspace Z');
  });

  it('gibt leere Hints zurück wenn kein Refinement-Abschnitt vorhanden', async () => {
    messagesCreateMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Nur Story, keine Hints' }] });

    const result = await generateStory('Eingabe');
    expect(result.refinementHints).toBe('');
  });
});

describe('refineStoryWithHints', () => {
  it('baut korrekte Nutzer-Message aus Hint-Paaren', async () => {
    messagesCreateMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Verfeinerte Story' }] });

    await refineStoryWithHints('Aktuelle Story', [
      { hint: 'Was ist unklar?', answer: 'Die Scope-Abgrenzung' },
    ]);

    const call = messagesCreateMock.mock.calls[0][0];
    const userContent = call.messages[0].content;
    expect(userContent).toContain('Aktuelle Story');
    expect(userContent).toContain('Was ist unklar?');
    expect(userContent).toContain('Die Scope-Abgrenzung');
  });

  it('gibt Story und Hints aus der Antwort zurück', async () => {
    messagesCreateMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Neue Story\n\n**Refinement Hinweise**\nNeuer Hinweis' }],
    });

    const result = await refineStoryWithHints('Story', [{ hint: 'H', answer: 'A' }]);
    expect(result.generatedStory).toContain('Neue Story');
    expect(result.refinementHints).toContain('Neuer Hinweis');
  });
});

describe('refineStory', () => {
  it('übergibt die Conversation-History direkt an messages.create', async () => {
    messagesCreateMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Überarbeitete Story' }] });

    const history = [
      { role: 'user' as const, content: 'Erste Eingabe' },
      { role: 'assistant' as const, content: 'Erste Story' },
      { role: 'user' as const, content: 'Bitte kürzer' },
    ];

    const result = await refineStory(history);
    expect(result.generatedStory).toBe('Überarbeitete Story');
    const call = messagesCreateMock.mock.calls[0][0];
    expect(call.messages).toEqual(history);
  });
});
