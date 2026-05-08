import { useEffect, useRef } from 'react';

/**
 * Runs `fn` after `delay` ms whenever any value in `deps` changes.
 * Uses a ref so `fn` is always fresh — no stale-closure risk.
 */
export function useDebounce(fn: () => void, deps: unknown[], delay: number): void {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  useEffect(() => {
    const timer = setTimeout(() => fnRef.current(), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
