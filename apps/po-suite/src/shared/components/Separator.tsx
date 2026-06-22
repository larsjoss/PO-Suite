interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className = '' }: SeparatorProps) {
  if (orientation === 'vertical') {
    return <div aria-hidden="true" className={`w-px shrink-0 bg-edge ${className}`} />;
  }
  return <hr aria-hidden="true" className={`border-none h-px bg-edge my-0 ${className}`} />;
}
