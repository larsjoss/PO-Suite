import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStory,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  addRefinement,
} from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('createStory', () => {
  it('persists a new story and returns it', () => {
    const story = createStory('Titel', 'Anforderung', 'Story-Text', 'Hinweise');
    expect(story.title).toBe('Titel');
    expect(story.rawInput).toBe('Anforderung');
    expect(story.generatedStory).toBe('Story-Text');
    expect(story.refinementHints).toBe('Hinweise');
    expect(story.id).toBeTruthy();
  });

  it('prepends new stories so the latest comes first', () => {
    const first = createStory('Erste', 'input1', 'story1', '');
    const second = createStory('Zweite', 'input2', 'story2', '');
    const { stories } = getStories();
    expect(stories[0].id).toBe(second.id);
    expect(stories[1].id).toBe(first.id);
  });
});

describe('getStories', () => {
  it('returns all stories when no query given', () => {
    createStory('A', 'x', 's', '');
    createStory('B', 'y', 's', '');
    const { stories, total } = getStories();
    expect(total).toBe(2);
    expect(stories).toHaveLength(2);
  });

  it('filters by title (case-insensitive)', () => {
    createStory('Login Feature', 'i', 's', '');
    createStory('Passwort Reset', 'i', 's', '');
    const { stories } = getStories('login');
    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe('Login Feature');
  });

  it('filters by rawInput', () => {
    createStory('T', 'Zahlungsabwicklung verbessern', 's', '');
    createStory('T', 'Login optimieren', 's', '');
    const { stories } = getStories('zahlung');
    expect(stories).toHaveLength(1);
    expect(stories[0].rawInput).toContain('Zahlungsabwicklung');
  });

  it('returns empty array when nothing matches', () => {
    createStory('Foo', 'Bar', 's', '');
    const { stories, total } = getStories('xyz123');
    expect(stories).toHaveLength(0);
    expect(total).toBe(0);
  });
});

describe('getStory', () => {
  it('returns story with its refinements', () => {
    const story = createStory('T', 'i', 's', '');
    addRefinement(story.id, 'Anweisung', 'Neue Story');
    const result = getStory(story.id);
    expect(result.story.id).toBe(story.id);
    expect(result.refinements).toHaveLength(1);
    expect(result.refinements[0].instruction).toBe('Anweisung');
  });

  it('throws when story id not found', () => {
    expect(() => getStory('nicht-vorhanden')).toThrow('Story nicht gefunden');
  });
});

describe('updateStory', () => {
  it('updates content and title, preserves other fields', () => {
    const story = createStory('Alt', 'input', 'alt-story', 'alt-hints');
    const updated = updateStory(story.id, 'neue-story', 'neue-hints', 'Neu');
    expect(updated.generatedStory).toBe('neue-story');
    expect(updated.refinementHints).toBe('neue-hints');
    expect(updated.title).toBe('Neu');
    expect(updated.rawInput).toBe('input');
  });

  it('throws when story id not found', () => {
    expect(() => updateStory('x', 's', 'h', 't')).toThrow('Story nicht gefunden');
  });
});

describe('deleteStory', () => {
  it('removes the story from the list', () => {
    const story = createStory('T', 'i', 's', '');
    deleteStory(story.id);
    expect(getStories().total).toBe(0);
  });

  it('also removes all associated refinements', () => {
    const story = createStory('T', 'i', 's', '');
    addRefinement(story.id, 'Anweisung', 'Ergebnis');
    deleteStory(story.id);
    expect(() => getStory(story.id)).toThrow();
  });

  it('does not affect other stories', () => {
    const keep = createStory('Bleiben', 'i', 's', '');
    const remove = createStory('Löschen', 'i', 's', '');
    deleteStory(remove.id);
    const { stories } = getStories();
    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe(keep.id);
  });
});
