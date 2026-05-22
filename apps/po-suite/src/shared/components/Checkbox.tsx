import { useId } from 'react';

interface CheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({
  id: externalId,
  label,
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
}: CheckboxProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          aria-checked={indeterminate ? 'mixed' : checked}
        />
        <span
          className={`w-[17px] h-[17px] rounded border border-edge bg-surface flex items-center justify-center
            transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1
            ${checked || indeterminate ? 'bg-brand border-brand' : ''}`}
          aria-hidden="true"
        >
          {checked && !indeterminate && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {indeterminate && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </span>
      <span className="text-[13px] text-ink">{label}</span>
    </label>
  );
}
