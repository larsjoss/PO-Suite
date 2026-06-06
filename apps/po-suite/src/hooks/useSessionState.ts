import { useState, useCallback } from 'react';

/**
 * Drop-in replacement for useState that persists state to sessionStorage.
 * State survives page reloads within the same tab but is cleared when the tab closes.
 *
 * Quota errors on write are silently swallowed — in-memory state is still updated
 * so the UI stays consistent even if persistence fails.
 * Setting `undefined` removes the key from sessionStorage rather than writing "undefined".
 */
export function useSessionState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored === null) return initial;
      return JSON.parse(stored) as T;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (value: T) => {
      if (value === undefined) {
        sessionStorage.removeItem(key);
      } else {
        try {
          sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
          // sessionStorage quota exceeded — continue without persisting
        }
      }
      setState(value);
    },
    [key],
  );

  return [state, set];
}
