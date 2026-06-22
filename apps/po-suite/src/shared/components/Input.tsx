import type { KeyboardEvent, ReactNode, RefObject } from 'react';

interface InputProps {
  id: string;
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  /** Trailing element inside the input border, e.g. RevealButton */
  suffix?: ReactNode;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function Input({
  id,
  label,
  hideLabel = false,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  required,
  autoComplete,
  suffix,
  inputRef,
  className = '',
  onKeyDown,
}: InputProps) {
  // Don't render a label element when hideLabel is true — the parent FormField owns the label.
  const labelEl = hideLabel ? null : (
    <label htmlFor={id} className="text-sm font-medium text-ink">
      {label}
      {required && (
        <span className="text-error ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );

  const inputClasses =
    'flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none disabled:cursor-not-allowed';

  if (suffix) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {labelEl}
        <div
          className={`flex items-center border border-edge rounded-lg bg-surface focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent${disabled ? ' opacity-40' : ''}`}
        >
          <input
            ref={inputRef}
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            onKeyDown={onKeyDown}
            className={inputClasses}
          />
          {suffix}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {labelEl}
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        className={`w-full border border-edge rounded-lg px-3 py-2.5 text-sm text-ink bg-surface placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent disabled:opacity-40 disabled:cursor-not-allowed`}
      />
    </div>
  );
}
