interface SnackbarProps {
  variant: 'success' | 'error' | 'info';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

function SuccessIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const variantStyles: Record<SnackbarProps['variant'], string> = {
  success: 'bg-brand-light text-green-700 border border-brand/15',
  error: 'bg-red-50 text-red-600 border border-red-200/60',
  info: 'bg-edge-2 text-ink-secondary border border-edge',
};

const icons: Record<SnackbarProps['variant'], () => JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

export function Snackbar({ variant, message, onDismiss, className = '' }: SnackbarProps) {
  const Icon = icons[variant];
  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      <Icon />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Meldung schließen"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
