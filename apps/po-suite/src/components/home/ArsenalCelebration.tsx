import { useEffect, useCallback } from 'react';

interface Props {
  onClose: () => void;
}

const CONFETTI_COLORS = [
  '#EF0107', '#EF0107', '#EF0107',
  '#FFFFFF', '#FFFFFF',
  '#FFD700', '#FFD700',
  '#DB0007', '#9C0000',
];

const confettiItems = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${(i * 7.3 + 13) % 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: `${2.5 + (i % 7) * 0.4}s`,
  delay: `${(i * 0.13) % 2.5}s`,
  size: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
  isCircle: i % 4 === 0,
}));

export function ArsenalCelebration({ onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #8B0000 0%, #EF0107 40%, #B20000 100%)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Arsenal Premier League Champions"
    >
      {/* Confetti */}
      {confettiItems.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 pointer-events-none"
          style={{
            left: p.left,
            width: p.size,
            height: p.isCircle ? p.size : p.size * 1.8,
            borderRadius: p.isCircle ? '50%' : 2,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} ${p.delay} linear forwards`,
          }}
        />
      ))}

      {/* Content */}
      <div
        className="relative text-center px-8 select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'celebration-fade-in 0.5s 0.2s ease-out both' }}
      >
        {/* Arsenal Cannon SVG */}
        <div className="flex justify-center mb-4">
          <svg
            width="120"
            height="60"
            viewBox="0 0 120 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Barrel */}
            <rect x="10" y="20" width="80" height="18" rx="9" fill="#FFD700" />
            <rect x="80" y="24" width="22" height="10" rx="5" fill="#DAA520" />
            {/* Muzzle ring */}
            <ellipse cx="10" cy="29" rx="6" ry="9" fill="#DAA520" />
            {/* Wheels */}
            <circle cx="30" cy="47" r="12" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
            <circle cx="30" cy="47" r="5" fill="#DAA520" />
            <circle cx="65" cy="47" r="12" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
            <circle cx="65" cy="47" r="5" fill="#DAA520" />
            {/* Carriage */}
            <rect x="18" y="34" width="60" height="8" rx="2" fill="#B8860B" />
          </svg>
        </div>

        {/* Trophy */}
        <div
          className="text-8xl mb-4 leading-none"
          style={{ animation: 'trophy-pop 0.6s 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          🏆
        </div>

        {/* Text */}
        <div style={{ animation: 'celebration-fade-in 0.5s 0.8s ease-out both' }}>
          <p
            className="font-serif text-5xl font-bold mb-2 leading-tight"
            style={{ color: '#FFD700', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            The Arsenal
          </p>
          <p
            className="text-white text-2xl font-semibold mb-1"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          >
            Premier League Champions
          </p>
          <p
            className="text-white/80 text-xl font-medium mb-8"
          >
            2024 / 25 ⚽
          </p>

          <button
            className="px-6 py-2 rounded-full text-sm font-medium transition-opacity"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
            }}
            onClick={onClose}
            autoFocus
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
}
