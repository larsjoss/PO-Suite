/**
 * Wraps a promise with a timeout. Rejects with a German error message if the
 * promise does not resolve within `ms` milliseconds.
 *
 * Uses Promise.race — the underlying Anthropic SDK call continues after timeout.
 * For a hard abort, pass an AbortSignal directly to the SDK call (see httpClient.ts).
 * The finally-block clears the timer so it doesn't leak after resolution.
 */
export async function withTimeout<T>(promise: Promise<T>, ms = 60_000): Promise<T> {
  const seconds = Math.round(ms / 1000);
  let timerId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`Zeitüberschreitung nach ${seconds} Sekunden. Bitte erneut versuchen.`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timerId!);
  }
}
