export async function withTimeout<T>(promise: Promise<T>, ms = 60_000): Promise<T> {
  const seconds = Math.round(ms / 1000);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Zeitüberschreitung nach ${seconds} Sekunden. Bitte erneut versuchen.`)),
      ms,
    ),
  );
  return Promise.race([promise, timeout]);
}
