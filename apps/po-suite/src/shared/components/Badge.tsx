import type { ReactNode } from 'react';

interface StatusBadgeProps {
  variant: 'pass' | 'fail' | 'pending' | 'inProgress';
  label: string;
}

interface ChipProps {
  variant?: 'default' | 'brand';
  children: ReactNode;
}

const statusStyles: Record<StatusBadgeProps['variant'], string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-600',
  pending: 'bg-edge-2 text-ink-secondary',
  inProgress: 'bg-brand-light text-brand',
};

const dotStyles: Record<StatusBadgeProps['variant'], string> = {
  pass: 'bg-green-500',
  fail: 'bg-red-500',
  pending: 'bg-ink-tertiary',
  inProgress: 'bg-brand',
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} aria-hidden="true" />
      {label}
    </span>
  );
}

const chipStyles: Record<NonNullable<ChipProps['variant']>, string> = {
  default: 'bg-edge-2 text-ink-secondary',
  brand: 'bg-brand-light text-brand',
};

export function Chip({ variant = 'default', children }: ChipProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${chipStyles[variant]}`}>
      {children}
    </span>
  );
}
