import type { ReactNode } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

function ChevronIcon() {
  return (
    <svg
      className="accordion-chevron w-4 h-4 text-ink-secondary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function Accordion({ items, className = '' }: AccordionProps) {
  return (
    <div className={`border border-edge rounded-[10px] overflow-hidden divide-y divide-edge ${className}`}>
      {items.map((item) => (
        <details key={item.id}>
          <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-ink cursor-pointer hover:bg-edge-2 list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
            <span>{item.title}</span>
            <ChevronIcon />
          </summary>
          <div className="px-4 py-3 text-sm text-ink-secondary bg-surface">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
