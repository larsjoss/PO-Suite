interface ProgressBarProps {
  value?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showPercent = false, className = '' }: ProgressBarProps) {
  const isIndeterminate = value === undefined;
  const clamped = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-ink-secondary">{label}</span>}
          {showPercent && !isIndeterminate && (
            <span className="text-xs text-ink-secondary">{clamped}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1 bg-edge-2 rounded-full overflow-hidden"
      >
        <div
          className={`h-full bg-brand rounded-full transition-[width] duration-300 ${isIndeterminate ? 'progress-indeterminate' : ''}`}
          style={isIndeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
