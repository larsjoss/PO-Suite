import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStories } from '../../hooks/useStories';
import { SearchBox } from './SearchBox';
import { StoryListItem } from './StoryListItem';

export function Sidebar() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useStories(q);
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <h2 className="font-serif text-sm font-semibold text-ink">Stories</h2>
      </div>

      <nav aria-label="Gespeicherte Stories" className="flex-1 overflow-hidden flex flex-col">
        <div className="px-3 pb-2 shrink-0">
          <SearchBox onSearch={setQ} />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span className="sr-only">Wird geladen…</span>
            </div>
          )}
          {!isLoading && data?.stories.length === 0 && (
            <p className="text-xs text-ink-tertiary text-center py-8 px-3 leading-relaxed">
              {q ? 'Keine Stories gefunden.' : 'Noch keine Stories.\nErstelle deine erste!'}
            </p>
          )}
          {data?.stories.map((story) => <StoryListItem key={story.id} story={story} />)}
        </div>
      </nav>

      <div className="p-3 border-t border-edge shrink-0">
        <button
          onClick={() => navigate('/tools/story-generator')}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand bg-brand-light hover:bg-brand-light/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Story
        </button>
      </div>
    </aside>
  );
}
