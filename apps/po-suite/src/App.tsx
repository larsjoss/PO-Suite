import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TopNav } from './components/layout/TopNav';

const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const ToolSelectionPage = lazy(() =>
  import('./pages/ToolSelectionPage').then((m) => ({ default: m.ToolSelectionPage })),
);
const WorkspacePage = lazy(() =>
  import('./pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage })),
);
const TextPolisherPage = lazy(() =>
  import('./pages/TextPolisherPage').then((m) => ({ default: m.TextPolisherPage })),
);
const TestCaseGeneratorPage = lazy(() =>
  import('./pages/TestCaseGeneratorPage').then((m) => ({ default: m.TestCaseGeneratorPage })),
);
const DocGeneratorPage = lazy(() =>
  import('./pages/DocGeneratorPage').then((m) => ({ default: m.DocGeneratorPage })),
);
const GoalGeneratorPage = lazy(() =>
  import('./pages/GoalGeneratorPage').then((m) => ({ default: m.GoalGeneratorPage })),
);

function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Seite wird geladen"
      className="flex-1 flex items-center justify-center bg-canvas"
    >
      <div className="flex items-center gap-3 text-ink-secondary">
        <span
          className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm">Lädt …</span>
      </div>
    </div>
  );
}

/*
 * ProtectedLayout: gemeinsamer Shell für alle authentifizierten Seiten.
 * Enthält die persistente TopNav und stellt h-screen + flex-Spalte bereit,
 * sodass untergeordnete Layouts (AppShell, ToolLayout) h-full nutzen können.
 */
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <>
      {/*
       * WCAG 2.4.1 – Bypass Blocks (AA): Skip-Navigation als erstes
       * fokussierbares Element der Seite. Ziel: #main-content in AppShell.
       */}
      <a
        href="#main-content"
        className="
          sr-only
          focus:not-sr-only
          focus:fixed focus:top-4 focus:left-4 focus:z-50
          focus:px-4 focus:py-2
          focus:bg-brand focus:text-white
          focus:rounded-lg focus:text-sm focus:font-medium
          focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand
          focus:outline-none
        "
      >
        Zum Inhalt springen
      </a>

      <Routes>
        <Route
          path="/auth"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthPage />
            </Suspense>
          }
        />

        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/tools" replace />} />
          <Route path="/tools" element={<ToolSelectionPage />} />
          <Route path="/tools/story-generator" element={<WorkspacePage />} />
          <Route path="/tools/story-generator/:id" element={<WorkspacePage />} />
          <Route path="/tools/text-polisher" element={<TextPolisherPage />} />
          <Route path="/tools/test-case-generator" element={<TestCaseGeneratorPage />} />
          <Route path="/tools/test-case-generator/:id" element={<TestCaseGeneratorPage />} />
          <Route path="/tools/doc-generator" element={<DocGeneratorPage />} />
          <Route path="/tools/goal-generator" element={<GoalGeneratorPage />} />
        </Route>

        {/* Legacy-URLs weiterleiten */}
        <Route path="/stories/:id" element={<Navigate to="/tools/story-generator" replace />} />
        <Route path="*" element={<Navigate to="/tools" replace />} />
      </Routes>
    </>
  );
}
