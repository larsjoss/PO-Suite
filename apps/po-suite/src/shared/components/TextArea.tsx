import { useEffect, useRef } from 'react';

interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoGrow?: boolean;
  className?: string;
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  disabled,
  autoGrow = false,
  className = '',
}: TextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoGrow || !ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [autoGrow, value]);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full border border-edge rounded-lg px-3 py-2.5 text-sm text-ink bg-surface placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent disabled:opacity-50 disabled:cursor-not-allowed${autoGrow ? ' resize-none overflow-hidden' : ' resize-none'}`}
      />
    </div>
  );
}
