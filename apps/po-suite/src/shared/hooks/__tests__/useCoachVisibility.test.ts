import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoachVisibility } from '../useCoachVisibility';
import { COACH_DISMISSED_KEY } from '../../services/storageKeys';

beforeEach(() => {
  localStorage.clear();
});

describe('useCoachVisibility', () => {
  it('startet mit isVisible=false', () => {
    const { result } = renderHook(() => useCoachVisibility());
    expect(result.current.isVisible).toBe(false);
  });

  it('showCoach setzt isVisible=true', () => {
    const { result } = renderHook(() => useCoachVisibility());
    act(() => result.current.showCoach());
    expect(result.current.isVisible).toBe(true);
  });

  it('dismiss setzt isVisible=false', () => {
    const { result } = renderHook(() => useCoachVisibility());
    act(() => result.current.showCoach());
    act(() => result.current.dismiss());
    expect(result.current.isVisible).toBe(false);
  });

  it('dismissForever setzt localStorage und isVisible=false', () => {
    const { result } = renderHook(() => useCoachVisibility());
    act(() => result.current.showCoach());
    act(() => result.current.dismissForever());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.isDismissedForever).toBe(true);
    expect(localStorage.getItem(COACH_DISMISSED_KEY)).toBe('true');
  });

  it('showCoach tut nichts wenn dauerhaft deaktiviert', () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    const { result } = renderHook(() => useCoachVisibility());
    act(() => result.current.showCoach());
    expect(result.current.isVisible).toBe(false);
  });

  it('isDismissedForever=true beim Mount wenn localStorage gesetzt', () => {
    localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    const { result } = renderHook(() => useCoachVisibility());
    expect(result.current.isDismissedForever).toBe(true);
  });
});
