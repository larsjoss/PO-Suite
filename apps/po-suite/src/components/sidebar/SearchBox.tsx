import { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  onSearch: (q: string) => void;
}

export function SearchBox({ onSearch }: Props) {
  const [value, setValue] = useState('');
  useDebounce(() => onSearch(value), [value], 300);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Storys durchsuchen…"
        aria-label="Storys durchsuchen"
        className="w-full pl-8 pr-3 py-2 text-sm border border-edge rounded-lg bg-canvas text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus:bg-surface placeholder:text-ink-tertiary"
      />
    </div>
  );
}
