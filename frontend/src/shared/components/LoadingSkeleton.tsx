interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

const LINE_WIDTHS = ['w-full', 'w-5/6', 'w-4/5', 'w-full', 'w-3/5'];

export function LoadingSkeleton({ lines = 5, className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse space-y-3 ${className}`}
      aria-busy="true"
      aria-label="Inhalt wird geladen"
      role="status"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-edge rounded ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Wird geladen…</span>
    </div>
  );
}
