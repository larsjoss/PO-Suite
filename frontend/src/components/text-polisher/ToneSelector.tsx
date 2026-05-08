import type { Tone } from '../../hooks/useTextPolisher';

interface Option {
  id: Tone;
  label: string;
}

const OPTIONS: Option[] = [
  { id: 'formell', label: 'Formell' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'informell', label: 'Informell' },
];

interface Props {
  value: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
}

export function ToneSelector({ value, onChange, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % OPTIONS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + OPTIONS.length) % OPTIONS.length;
    else return;
    e.preventDefault();
    onChange(OPTIONS[next].id);
  };

  return (
    /*
     * Segmented Control als radiogroup (UI-06 / AK-8).
     * WCAG 4.1.2: role="radiogroup" + role="radio" + aria-checked.
     * Arrow-Key-Navigation nach ARIA APG Radio Group Pattern.
     */
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink" id="tone-group-label">
        Tonalität
      </span>
      <div
        role="radiogroup"
        aria-labelledby="tone-group-label"
        className="flex rounded-lg border border-edge overflow-hidden"
      >
        {OPTIONS.map((opt, idx) => {
          const isActive = opt.id === value;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={isActive}
              tabIndex={opt.id === value ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={[
                'flex-1 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:opacity-50 disabled:cursor-not-allowed',
                idx > 0 ? 'border-l border-edge' : '',
                isActive
                  ? 'bg-brand text-white focus-visible:ring-white'
                  : 'bg-surface text-ink-secondary hover:bg-edge-2 hover:text-ink focus-visible:ring-brand',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
