# AI Tools — Frontend (PO Suite)

React 18 + TypeScript + Vite SPA. Fünf Tools: Story Generator, Goal Generator, Text Polisher, Test Case Generator, Doc Generator. Build läuft vollständig im Browser gegen die Anthropic API (GitHub-Pages-Variante) oder via Express-Backend (Enterprise-Variante).

## Aktueller Stand

**Repo:** `larsjoss/PO-Suite` — **Hauptbranch:** `main`

Alle fünf Module vollständig implementiert. **448 Vitest-Tests + 10 Playwright-E2E-Tests grün, Build sauber** (211 kB Hauptbundle, Code-Splitting via lazy-loaded Pages).

**GitHub Pages:** `https://larsjoss.github.io/PO-Suite/` — Deploy automatisch auf Push zu `main` mit Änderungen unter `apps/po-suite/**` oder manuell via `workflow_dispatch`.

## Letzte Änderungen (Session 2026-05-18)

- **Monorepo-Migration**: `frontend/` → `apps/po-suite/`, `backend/` → `apps/backend/`, Root-`package.json` mit npm Workspaces, geteilte `tsconfig.base.json` + `eslint.config.js`
- **ESLint** hinzugefügt (TypeScript, React, A11y-Plugins) — 0 Errors, 0 Warnings
- **`.env`-Setup**: Root-`.env.example` mit Dokumentation; Vite liest via `envDir: '../../'` vom Monorepo-Root
- **`withTimeout` in allen Services**: Story Generator (`claude.ts`) und Text Polisher (`textPolisher.ts`) nachgezogen — alle fünf Services nutzen nun konsistent `withTimeout()`

## Nächster Schritt

**P1 — `window.confirm()` in DocGeneratorPage ersetzen** (`src/pages/DocGeneratorPage.tsx:52`): Synchrones Dialog für Mode-Wechsel durch eine wiederverwendbare `ConfirmDialog`-Komponente in `src/shared/components/` ersetzen. Muster: controlled Dialog, `open`/`onConfirm`/`onCancel`-Props, `role="alertdialog"`, ARIA-Beschriftung.

## Konventionen

| Was | Wie |
|---|---|
| Modell | `claude-sonnet-4-5`, `max_tokens` tool-spezifisch (2048 / 4000 / 6000) |
| API-Calls | nur via `getApiClient()` aus `shared/services/apiClient.ts` |
| Timeout | **alle** API-Calls via `withTimeout()` aus `shared/services/withTimeout.ts` (60 s) |
| System-Prompts | zentral in `services/prompts.ts` — kein Prompt im Service oder Hook |
| Storage-Keys | zentral in `shared/services/storageKeys.ts` — kein Hardcoding |
| Neues Tool | Prompt → Service → Hook → Komponenten → Page → `App.tsx` (lazy) → `constants/tools.tsx` |
| State-Pattern | `'input' | 'output'` State-Machine (Vorbild TCG/DocGen) |
| Validierung | Submit-Button `disabled`, kein Toast/Alert |
| Fehler | `InlineError` im Input-Screen und im Output-Panel bei Regenerierung |
| sessionStorage | kein Direktzugriff in Komponenten — nur via `getApiClient()`, `AuthContext`, `useSessionState` |

## Entwicklung

```bash
npm install                    # Root-Install (alle Workspaces)
npm run dev                    # http://localhost:5173
npm run test                   # 448 Tests
npm run build                  # tsc + Vite, muss 0 Warnings haben
cd apps/po-suite && npm run e2e  # 10 Playwright-Tests
```

## Ordnerstruktur

```
src/
├── App.tsx                   Router + ProtectedLayout (TopNav + Outlet)
├── types/index.ts            Alle geteilten Typen
├── context/AuthContext.tsx   Auth-State, login/logout, setApiKey
├── constants/tools.tsx       Single-Source-of-Truth: alle 5 Tool-Definitionen
├── shared/
│   ├── services/
│   │   ├── apiClient.ts      getApiClient(), extractTextContent()
│   │   ├── storageKeys.ts    Zentrale sessionStorage-Keys (SDK-frei)
│   │   ├── withTimeout.ts    withTimeout() — 60 s default
│   │   └── imageBlocks.ts    buildImageBlock(), buildImageBlocks()
│   └── components/           Button, TextArea, CopyButton, InlineError,
│                             LoadingSkeleton, MarkdownOutput, PanelHeader,
│                             RevealButton, ScreenshotUpload, SettingsDialog
├── services/
│   ├── prompts.ts            Alle System-Prompts (Single Source)
│   ├── claude.ts             Story Generator
│   ├── textPolisher.ts       Text Polisher
│   ├── testCaseGenerator.ts  Test Case Generator
│   ├── docGenerator.ts       Doc Generator
│   ├── goalGenerator.ts      Goal Generator
│   └── storage.ts            localStorage CRUD (Stories)
├── hooks/                    useStory, useStories, useTextPolisher,
│                             useTestCaseGenerator, useDocGenerator,
│                             useGoalGenerator, useCopyToClipboard,
│                             useDebounce, useSessionState
└── pages/                    AuthPage, ToolSelectionPage, WorkspacePage,
                              TextPolisherPage, TestCaseGeneratorPage,
                              DocGeneratorPage, GoalGeneratorPage
```

## Tool-Details

| Tool | max_tokens | Besonderheiten |
|---|---|---|
| Story Generator | 2048 | AppShell (3-Panel), localStorage-Persist, Refinement-Loop mit Hint-Paaren |
| Text Polisher | 2048 | 3 Use Cases (email/meeting/freetext), sessionStorage-Persist, Ton-Auswahl nur bei email |
| Test Case Generator | 4000 | JSON-Output, Jira-Export, bis zu 3 Screenshots, ephemer (kein Persist) |
| Doc Generator | 4000/6000 | 2 Modi (story/feature), Markdown-Output, Screenshots, `window.confirm()` bei Mode-Wechsel ⚠ |
| Goal Generator | 2000/1000, 6000/2000 | 2 Tabs (sprint-goal/pi-objective), 2–3 Varianten + Refinement-Loop |

## Auth

Env-Var-Credentials (`VITE_AUTH_EMAIL` / `VITE_AUTH_PASSWORD`) aus `.env.local` am Monorepo-Root (Vite `envDir: '../../'`). Bei fehlenden Vars wirft Login einen klaren Konfigurationsfehler. API-Key wird nur im Login-Formular eingegeben und in sessionStorage gehalten — nie in `.env`.

## Design-Tokens (Tailwind)

```
brand      #1C2B1E  / brand-light #E8EFE9
canvas     #F5F0E8  (Seiten-Hintergrund)
surface    #FAFAF8  (Karten, Panels)
ink        #1C2420  / ink-secondary #5C5852
edge       #DDD8CF  / edge-2 #EBE6DA
font-serif Playfair Display  /  font-sans Inter
```

## Tests

448 Tests in 42 Dateien — Vitest + @testing-library/react + jsdom.

**Muster:**
- Service-Tests: `vi.mock('shared/services/apiClient')` → `messagesCreateMock`
- Page-Tests: `vi.mock('../services/...')` + `QueryClientProvider`-Wrapper
- Auth-Tests: Credentials via `vitest.config.ts → test.env` (kein `vi.stubEnv`)
- Copy-Tests: `Object.defineProperty(navigator, 'clipboard', ...)` + `fireEvent.click`

## Accessibility (WCAG 2.1 AA)

Skip-Link → `#main-content`, `role="tablist/tab"` + Arrow-Key-Navigation in AppShell/UseCaseSelector/DocModeSelector, `role="radiogroup/radio"` in ToneSelector, `role="alert"` auf InlineError, `role="status"` auf LoadingSkeleton, programmatischer Fokus nach Generierung (`tabIndex={-1}` + `useEffect`), Touch-Targets ≥ 44×44 px.

## Bekannte Eigenheiten

- **Story Generator abweichendes Layout**: Einziger Tool mit AppShell (3-Panel-Layout) statt 2-Screen-State-Machine — historisch gewachsen, nicht unified.
- **`window.confirm()` in DocGenerator**: `src/pages/DocGeneratorPage.tsx:52` — nicht testbar in jsdom, blockiert Keyboard. P1-Schuld.
- **Enterprise-httpClient nicht unit-getestet**: `src/shared/services/httpClient.ts` ist nur via `vitest.enterprise.config.ts` (15 Tests) abgedeckt — keine Service-Level-Unit-Tests.
- **`dangerouslyAllowBrowser: true`**: Nur für Single-User-Prototypen, API-Key liegt im Browser.

## Claude Code Konfiguration

**Hooks** (`.claude/settings.json`): `SessionStart` → `session-start.sh` (npm install bei Remote), `PostToolUse` → Test-Run nach `git commit`.

**Slash Commands**: `/new-component` (React-Konventionen), `/new-service` (Service-Konventionen inkl. `withTimeout`-Pflicht).
