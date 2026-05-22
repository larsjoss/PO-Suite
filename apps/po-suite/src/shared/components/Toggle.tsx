interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <label className={`inline-flex items-center gap-2.5 select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-10 h-[23px] rounded-full transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
          ${checked ? 'bg-brand' : 'bg-edge'}`}
      >
        <span
          className="absolute top-[3px] w-[17px] h-[17px] rounded-full bg-white shadow-sm transition-[left] duration-200"
          style={{ left: checked ? '20px' : '3px' }}
          aria-hidden="true"
        />
      </button>
      {label && (
        <span className="text-sm text-ink">{label}</span>
      )}
    </label>
  );
}
