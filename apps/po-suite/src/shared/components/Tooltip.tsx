import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={[
            'absolute z-50 whitespace-nowrap bg-ink text-white text-xs rounded-md px-2 py-1 pointer-events-none',
            position === 'top'
              ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
              : 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          ].join(' ')}
        >
          {content}
        </div>
      )}
    </div>
  );
}
