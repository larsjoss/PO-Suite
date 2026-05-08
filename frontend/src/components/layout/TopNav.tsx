import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SettingsDialog } from '../../shared/components/SettingsDialog';
import { TOOLS } from '../../constants/tools';

function KeyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export function TopNav() {
  const { logout, apiKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const activeTool = TOOLS.find((t) => location.pathname.startsWith(t.path));

  // Scroll active tab into center of the nav strip (mobile)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const navRect = nav.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    nav.scrollLeft += activeRect.left - navRect.left - (navRect.width - activeRect.width) / 2;
  }, [activeTool?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <>
      {/*
       * WCAG 4.1.2 / 1.3.6 — <header> als Banner-Landmark.
       * sticky top-0 stellt sicher, dass Wayfinding beim Scrollen sichtbar bleibt.
       */}
      <header
        className="sticky top-0 z-20 bg-surface border-b border-edge shrink-0"
        aria-label="Seitennavigation"
      >
        <div className="flex items-stretch h-12 px-4">

          {/* Brand + Kontext-Label */}
          <div className="flex items-center gap-2 shrink-0 pr-3">
            <NavLink
              to="/tools"
              className="font-serif text-sm font-semibold text-ink hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              AI Tools
            </NavLink>
            {activeTool && (
              <>
                <span className="text-ink-tertiary text-xs select-none" aria-hidden="true">›</span>
                <span className="hidden sm:inline font-serif text-sm font-semibold text-ink truncate max-w-[180px]">
                  {activeTool.title}
                </span>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-edge my-2.5 shrink-0" aria-hidden="true" />

          {/* Tool-Tabs — horizontally scrollable, active state: 3px bottom underline */}
          <nav
            ref={navRef}
            aria-label="Tool-Navigation"
            className="flex items-stretch flex-1 min-w-0 overflow-x-auto
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {TOOLS.map((tool) => {
              const isActive = location.pathname.startsWith(tool.path);
              return (
                <NavLink
                  key={tool.id}
                  to={tool.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-1.5 px-3 h-full shrink-0 text-xs border-b-2 transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                    isActive
                      ? 'border-brand text-ink font-semibold'
                      : 'border-transparent text-ink-secondary font-medium hover:text-ink hover:border-edge',
                  ].join(' ')}
                >
                  <tool.Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tool.navLabel}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Rechte Seite: API-Key-Status + Einstellungen + Logout */}
          <div className="flex items-center gap-1 shrink-0 pl-3">
            <span
              aria-label={apiKey ? 'Anthropic API-Key aktiv' : 'Kein API-Key konfiguriert'}
              className={`flex items-center gap-1.5 text-xs mr-1 select-none ${
                apiKey ? 'text-green-700' : 'text-ink-tertiary'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${apiKey ? 'bg-green-500' : 'bg-edge'}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">API</span>
            </span>

            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="API-Key-Einstellungen öffnen"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-edge-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <KeyIcon />
              <span className="hidden sm:inline">Einstellungen</span>
            </button>

            <button
              onClick={handleLogout}
              aria-label="Abmelden"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-edge-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
