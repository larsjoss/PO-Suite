export function internalError(err: unknown): string {
  if (process.env.NODE_ENV === 'production') return 'Interner Serverfehler';
  return err instanceof Error ? err.message : 'Unbekannter Fehler';
}
