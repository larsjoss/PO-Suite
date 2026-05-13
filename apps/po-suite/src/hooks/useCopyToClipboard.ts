import { useState, useCallback } from 'react';

export function useCopyToClipboard(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeoutMs);
    } catch {
      alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
    }
  }, [timeoutMs]);

  return { copied, copy };
}
