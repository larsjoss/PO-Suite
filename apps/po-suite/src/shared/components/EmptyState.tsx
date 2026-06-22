import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title?: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-8 py-10 ${className}`}>
      <div className="w-10 h-10 bg-edge-2 rounded-xl flex items-center justify-center mb-3" aria-hidden="true">
        {icon}
      </div>
      {title && (
        <p className="text-sm font-medium text-ink-secondary mb-1">{title}</p>
      )}
      <p className="text-sm text-ink-tertiary leading-relaxed">{description}</p>
    </div>
  );
}
