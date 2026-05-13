interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    /*
     * WCAG 4.1.3 – Status Messages: role="alert" + aria-live="assertive"
     * meldet Fehler sofort an Screen Reader ohne Fokusverschiebung.
     */
    <p
      role="alert"
      aria-live="assertive"
      className={`text-sm text-red-600 flex items-start gap-1.5 ${className}`}
    >
      <svg
        className="w-4 h-4 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {message}
    </p>
  );
}
