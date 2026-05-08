import { useState, useCallback } from 'react';

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
