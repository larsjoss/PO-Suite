import { HANDOFF_KEY } from './storageKeys';

const TTL_MS = 15 * 60 * 1000;

export interface StoryHandoff {
  source: 'story' | 'testcase';
  timestamp: number;
  title: string;
  content: string;
}

export function extractFirstLine(text: string): string {
  return text.split('\n').find((l) => l.trim()) ?? '';
}

export function setHandoff(payload: StoryHandoff): void {
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
}

export function getHandoff(): StoryHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoryHandoff;
    if (!parsed.source || Date.now() - parsed.timestamp > TTL_MS) {
      clearHandoff();
      return null;
    }
    return parsed;
  } catch {
    clearHandoff();
    return null;
  }
}

export function clearHandoff(): void {
  sessionStorage.removeItem(HANDOFF_KEY);
}
