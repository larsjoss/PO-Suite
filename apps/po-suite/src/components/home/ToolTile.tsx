import { useNavigate } from 'react-router-dom';
import type { ToolDef } from '../../constants/tools';
import { LAST_USED_TOOL_KEY, LAST_USED_AT_KEY } from '../../shared/services/storageKeys';

interface Props {
  tool: ToolDef;
  isLastUsed?: boolean;
}

export function ToolTile({ tool, isLastUsed = false }: Props) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem(LAST_USED_TOOL_KEY, tool.id);
        localStorage.setItem(LAST_USED_AT_KEY, String(Date.now()));
        navigate(tool.path);
      }}
      className="group relative flex flex-col h-full text-left bg-surface border border-edge rounded-xl p-5
                 hover:border-brand hover:shadow-sm transition-all
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-1.5 self-start mb-4 flex-wrap">
        <span
          className="inline-flex items-center px-2 py-0.5
                     text-[10px] font-semibold uppercase tracking-wider
                     text-ink-secondary bg-edge-2 rounded-full"
        >
          {tool.chipLabel}
        </span>
        {isLastUsed && (
          <span
            className="inline-flex items-center px-2 py-0.5
                       text-[10px] font-semibold uppercase tracking-wider
                       text-brand bg-brand/10 rounded-full"
          >
            Zuletzt genutzt
          </span>
        )}
      </div>

      <div className="mb-4 w-fit" aria-hidden="true">
        <div className="bg-brand-light rounded-xl p-2.5 text-brand group-hover:scale-105 transition-transform">
          <tool.Icon className="w-8 h-8" />
        </div>
      </div>

      <h3 className="font-serif text-base font-semibold text-ink mb-1.5">{tool.title}</h3>
      <p className="text-xs text-ink-secondary leading-relaxed flex-1">{tool.description}</p>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand" aria-hidden="true">
        <span>Öffnen</span>
        <svg
          className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
