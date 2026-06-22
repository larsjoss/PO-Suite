import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'warning' | 'success' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const STYLES: Record<AlertVariant, { container: string; icon: string; title: string; body: string }> = {
  info: {
    container: 'bg-brand-light border-brand/20',
    icon: 'text-brand',
    title: 'text-ink',
    body: 'text-ink-secondary',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-700',
    title: 'text-amber-900',
    body: 'text-amber-800',
  },
  success: {
    container: 'bg-success/10 border-success/20',
    icon: 'text-success',
    title: 'text-ink',
    body: 'text-ink-secondary',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-error',
    title: 'text-error',
    body: 'text-red-700',
  },
};

function InfoIcon({ className }: { className: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon({ className }: { className: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SuccessIcon({ className }: { className: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon({ className }: { className: string }) {
  return (
    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const ICONS: Record<AlertVariant, (props: { className: string }) => JSX.Element> = {
  info: InfoIcon,
  warning: WarningIcon,
  success: SuccessIcon,
  error: ErrorIcon,
};

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const styles = STYLES[variant];
  const Icon = ICONS[variant];
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start gap-2.5 border rounded-lg px-3.5 py-3 text-sm ${styles.container} ${className}`}
    >
      <Icon className={styles.icon} />
      <div className="min-w-0">
        {title && (
          <p className={`font-semibold text-sm leading-snug mb-0.5 ${styles.title}`}>{title}</p>
        )}
        <div className={`text-sm leading-relaxed ${styles.body}`}>{children}</div>
      </div>
    </div>
  );
}
