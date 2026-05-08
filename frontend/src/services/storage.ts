import type { Story, RefinementLog, StoriesResponse, StoryDetailResponse } from '../types';

const STORIES_KEY = 'sg_stories';
const REFINEMENTS_KEY = 'sg_refinements';

function loadStories(): Story[] {
  try {
    return JSON.parse(localStorage.getItem(STORIES_KEY) ?? '[]') as Story[];
  } catch {
    return [];
  }
}

function saveStories(stories: Story[]): void {
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

function loadRefinements(): RefinementLog[] {
  try {
    return JSON.parse(localStorage.getItem(REFINEMENTS_KEY) ?? '[]') as RefinementLog[];
  } catch {
    return [];
  }
}

function saveRefinements(logs: RefinementLog[]): void {
  localStorage.setItem(REFINEMENTS_KEY, JSON.stringify(logs));
}

export function getStories(q?: string): StoriesResponse {
  let stories = loadStories();
  if (q?.trim()) {
    const lower = q.toLowerCase();
    stories = stories.filter(
      (s) =>
        s.title.toLowerCase().includes(lower) || s.rawInput.toLowerCase().includes(lower),
    );
  }
  stories.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { stories, total: stories.length };
}

export function getStory(id: string): StoryDetailResponse {
  const story = loadStories().find((s) => s.id === id);
  if (!story) throw new Error('Story nicht gefunden');
  const refinements = loadRefinements()
    .filter((r) => r.storyId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return { story, refinements };
}

export function createStory(
  title: string,
  rawInput: string,
  generatedStory: string,
  refinementHints: string,
): Story {
  const stories = loadStories();
  const now = new Date().toISOString();
  const story: Story = {
    id: crypto.randomUUID(),
    userId: '1',
    title,
    rawInput,
    generatedStory,
    refinementHints,
    createdAt: now,
    updatedAt: now,
  };
  stories.unshift(story);
  saveStories(stories);
  return story;
}

export function updateStory(
  id: string,
  generatedStory: string,
  refinementHints: string,
  title: string,
): Story {
  const stories = loadStories();
  const idx = stories.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Story nicht gefunden');
  const updated: Story = {
    ...stories[idx],
    title,
    generatedStory,
    refinementHints,
    updatedAt: new Date().toISOString(),
  };
  stories[idx] = updated;
  saveStories(stories);
  return updated;
}

export function addRefinement(
  storyId: string,
  instruction: string,
  resultStory: string,
): RefinementLog {
  const logs = loadRefinements();
  const log: RefinementLog = {
    id: crypto.randomUUID(),
    storyId,
    instruction,
    resultStory,
    createdAt: new Date().toISOString(),
  };
  logs.push(log);
  saveRefinements(logs);
  return log;
}

export function deleteStory(id: string): void {
  saveStories(loadStories().filter((s) => s.id !== id));
  saveRefinements(loadRefinements().filter((r) => r.storyId !== id));
}
