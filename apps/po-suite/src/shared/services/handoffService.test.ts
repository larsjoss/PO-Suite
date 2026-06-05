import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearHandoff, getHandoff, setHandoff } from './handoffService';
import { HANDOFF_KEY } from './storageKeys';

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('handoffService', () => {
  it('setHandoff / getHandoff happy path — gibt das Objekt zurück', () => {
    setHandoff({ source: 'story', timestamp: Date.now(), title: 'Titel', content: 'Story text' });
    const result = getHandoff();
    expect(result).not.toBeNull();
    expect(result?.source).toBe('story');
    expect(result?.title).toBe('Titel');
    expect(result?.content).toBe('Story text');
  });

  it('getHandoff mit abgelaufenem Timestamp (> 15 Min) → null, Key gelöscht', () => {
    const expired = Date.now() - 16 * 60 * 1000;
    setHandoff({ source: 'story', timestamp: expired, title: '', content: 'alt' });
    const result = getHandoff();
    expect(result).toBeNull();
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull();
  });

  it('clearHandoff — Key nicht mehr in sessionStorage', () => {
    setHandoff({ source: 'story', timestamp: Date.now(), title: '', content: 'x' });
    clearHandoff();
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull();
  });

  it('getHandoff ohne gesetzten Key → null', () => {
    expect(getHandoff()).toBeNull();
  });
});
