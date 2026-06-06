import { HANDOFF_KEY } from './storageKeys';

/** Handoff expires after 15 minutes to avoid stale context surfacing hours later. */
const TTL_MS = 15 * 60 * 1000;

export interface StoryHandoff {
  source: 'story' | 'testcase';
  timestamp: number;
  title: string;
  content: string;
}

/** Returns the first non-empty line of `text`, or an empty string. */
export function extractFirstLine(text: string): string {
  return text.split('\n').find((l) => l.trim()) ?? '';
}

/** Writes a handoff payload to sessionStorage. Overwrites any existing handoff. */
export function setHandoff(payload: StoryHandoff): void {
  sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
}

/**
 * Reads the handoff payload from sessionStorage.
 * Returns null if no handoff exists, the payload is malformed, or the TTL has expired.
 * Clears an expired or malformed handoff automatically.
 */
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

/** Removes the handoff payload from sessionStorage. */
export function clearHandoff(): void {
  sessionStorage.removeItem(HANDOFF_KEY);
}
