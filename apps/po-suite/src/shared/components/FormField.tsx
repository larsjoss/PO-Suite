import type { ReactNode } from 'react';

interface FormFieldProps {
  /** Must match the `id` of the child input for correct label association */
  htmlFor: string;
  label: string;
  hideLabel?: boolean;
  required?: boolean;
  /** Helper text shown below the control. Accepts ReactNode for complex layouts (e.g. char counter). */
  description?: ReactNode;
  /** Inline field-level error message */
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  htmlFor,
  label,
  hideLabel = false,
  required,
  description,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className={`flex items-center gap-1${hideLabel ? ' sr-only' : ''}`}>
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
        {required && (
          <span className="text-error text-sm" aria-hidden="true">
            *
          </span>
        )}
      </div>

      {children}

      {description && (
        <div className="text-xs text-ink-secondary">{description}</div>
      )}

      {error && (
        <p role="alert" aria-live="assertive" className="text-xs text-error flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 shrink-0"
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
          {error}
        </p>
      )}
    </div>
  );
}
