import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useTeamContext } from '../useTeamContext';
import { TEAM_CONTEXT_KEY } from '../../services/storageKeys';

afterEach(() => {
  localStorage.clear();
});

describe('useTeamContext', () => {
  it('returns empty string when no key in localStorage', () => {
    const { result } = renderHook(() => useTeamContext());
    expect(result.current.teamContext).toBe('');
  });

  it('returns stored value when key exists in localStorage', () => {
    localStorage.setItem(TEAM_CONTEXT_KEY, 'hello');
    const { result } = renderHook(() => useTeamContext());
    expect(result.current.teamContext).toBe('hello');
  });

  it('trims input to 800 characters', () => {
    const { result } = renderHook(() => useTeamContext());
    act(() => {
      result.current.setTeamContext('x'.repeat(900));
    });
    expect(result.current.teamContext).toHaveLength(800);
    expect(localStorage.getItem(TEAM_CONTEXT_KEY)).toHaveLength(800);
  });
});
