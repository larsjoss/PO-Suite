import { describe, it, expect } from 'vitest';
import { parseOutput, extractTitle, formatStoryMarkdown } from './claude';

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
