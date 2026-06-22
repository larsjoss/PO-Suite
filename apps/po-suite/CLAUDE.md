# PO Suite — Developer Guide (Claude Code)

React 18 + TypeScript + Vite SPA. Fünf KI-gestützte Tools für Product Owner in agilen Teams (Scrum/SAFe). Build läuft vollständig im Browser gegen die Anthropic API (GitHub-Pages-Variante) oder via Express-Backend (Enterprise-Variante).

**Repo:** `larsjoss/PO-Suite` — **Hauptbranch:** `main`  
**GitHub Pages:** `https://larsjoss.github.io/PO-Suite/`  
**Architekturentscheide:** [`docs/adr/`](../../docs/adr/README.md)

---

## Projekt-Übersicht

**Was:** Fünf KI-Tools die die häufigsten Schreibaufgaben im PO-Alltag automatisieren — Story-Schreiben, Test Cases, Sprint Goals, PI Objectives, Dokumentation, Texte polieren.

**Für wen:** Einzelner Product Owner (Single-User-Prototyp). Kein Multi-User, kein Team-Sharing in der GitHub-Pages-Variante.

**Warum kein Backend (GitHub-Pages-Variante):** Privacy (Business-Kontext verlässt nur via Anthropic API den Browser), Zero-Ops (GitHub Pages, kein Server), und Entwicklungsgeschwindigkeit. Details: [ADR-002](../../docs/adr/ADR-002-client-side-spa.md).

---

## Tech Stack

| Layer | Technologie | Version |
|---|---|---|
| UI | React 18 + TypeScript | 18.x / 5.x |
| Build | Vite | 5.4 |
| Styling | Tailwind CSS v3 + CSS Custom Properties | 3.x |
| Routing | React Router v6 | 6.x |
| Server-State | TanStack Query v5 | 5.x |
| KI | @anthropic-ai/sdk, Modell `claude-sonnet-4-5` | latest |
| Tests | Vitest 4 + @testing-library/react + jsdom | 4.x |
| E2E | Playwright | latest |
| Linting | ESLint Flat Config v9 + typescript-eslint | 9.x |

---

## Entwicklungs-Befehle

```bash
# Root-Ebene (empfohlen)
npm install                          # Root-Install (alle Workspaces)
npm run dev                          # Dev-Server: http://localhost:5173
npm run test                         # 634 Vitest-Tests (GitHub-Pfad)
npm run build                        # tsc + Vite, muss 0 Errors haben
npm run lint                         # ESLint für Frontend + Backend

# Im apps/po-suite/ Workspace
cd apps/po-suite
npm run test:run                     # Tests ohne Watch-Mode
npm run test:coverage                # Coverage-Report (v8)
npm run e2e                          # 10 Playwright-Tests (einmalig: npx playwright install chromium)
npm run test:enterprise              # 15 Enterprise-Pfad-Tests

# Mit Backend (Enterprise-Variante)
docker compose up                    # db + backend
cd apps/backend && npm test          # 18 Backend-Tests
```

---

## Kritische Constraints — NIE ändern ohne Begründung

| Constraint | Warum |
|---|---|
| `sessionStorage.getItem('anthropic_api_key')` — genau dieser Key | Tests in `apiClient.test.ts` prüfen explizit dass der Key **nicht** aus localStorage kommt. Änderung = Sicherheitsregression. |
| `IS_ENTERPRISE` nur aus `shared/config/env.ts` lesen | Compile-Time-Tree-Shaking. Direktes `import.meta.env.VITE_TARGET` in Komponenten/Hooks zerstört den ADR-003-Ansatz. |
| Alle Storage-Keys aus `shared/services/storageKeys.ts` | Kein Hardcoding. Bei Änderung eines Keys muss `storageKeys.ts` der einzige Ort sein. |
| `withTimeout()` um **alle** API-Calls | Kein API-Call ohne 60-s-Timeout. Neue Services müssen `withTimeout` einbinden. |
| Prompts nur in `src/services/prompts/` | Kein Prompt-Text in Services, Hooks oder Komponenten. |

---

## Architektur-Prinzipien

### Dual-Build (GitHub Pages / Enterprise)

```
VITE_TARGET=github (Default)     →  IS_ENTERPRISE = false
VITE_TARGET=enterprise           →  IS_ENTERPRISE = true
```

Vite löst `IS_ENTERPRISE` zur Build-Zeit auf. Enterprise-Branches werden aus dem GitHub-Bundle entfernt (Tree-Shaking). Jeder Hook hat zwei Pfade:
- **GitHub:** `getApiClient()` + `withTimeout()` → direkt zur Anthropic API
- **Enterprise:** `fetchApi()` aus `httpClient.ts` → zum Express-Backend

### Service-Layer-Aufbau (neues Tool)

```
prompts/ → service → hook → components → Page → App.tsx (lazy) → constants/tools.tsx
```

Kein Schritt überspringen. Services enthalten Prompt-Aufbau und API-Call. Hooks enthalten State-Management und Mutations. Komponenten enthalten nur UI.

### State-Pattern

Alle Tools ausser Story Generator: `'input' | 'output'`-State-Machine.

```typescript
const [screen, setScreen] = useState<'input' | 'output'>('input');
```

Story Generator ist historisch abweichend (3-Panel-AppShell) — nicht als Vorbild nehmen.

### Storage-Strategie

| Was | Wo | Warum |
|---|---|---|
| API-Key | `sessionStorage` | Tab-scoped, wird bei Browser-Close gelöscht |
| Auth-State, Handoff | `sessionStorage` | Kurzlebig, Tab-scoped |
| Stories, Testpläne | `localStorage` | Persistent, überlebt Reload |
| Workspaces | `localStorage` | Persistent, max. 10 Stück mit LRU-Rotation |
| Kein Direktzugriff in Komponenten | — | Nur via `getApiClient()`, `AuthContext`, `useSessionState` |

---

## Dateistruktur

```
apps/po-suite/
├── src/
│   ├── App.tsx                      Router + ProtectedLayout (TopNav + Outlet)
│   ├── types/index.ts               Alle geteilten Frontend-Typen
│   ├── context/
│   │   ├── AuthContext.tsx           Auth-State, login/logout, setApiKey
│   │   └── ThemeContext.tsx          Dark/Light-Mode, localStorage-Persistenz (po-theme)
│   ├── constants/tools.tsx          Single-Source-of-Truth: alle 5 Tool-Definitionen
│   ├── shared/
│   │   ├── config/
│   │   │   └── env.ts               IS_ENTERPRISE, API_BASE (einzige Source)
│   │   ├── services/
│   │   │   ├── apiClient.ts         getApiClient(), extractTextContent()
│   │   │   ├── storageKeys.ts       Alle Storage-Keys (kein Hardcoding)
│   │   │   ├── withTimeout.ts       withTimeout() — 60 s Default, Promise.race
│   │   │   ├── httpClient.ts        fetchApi(), fetchApiGet(), fetchApiDelete() (Enterprise)
│   │   │   ├── handoffService.ts    Tool-zu-Tool-Handoff via sessionStorage (15-min TTL)
│   │   │   ├── imageBlocks.ts       buildImageBlocks() für Screenshots
│   │   │   ├── promptUtils.ts       buildSystemPrompt() — Team+Workspace-Kontext
│   │   │   └── workspaceService.ts  localStorage CRUD für Workspaces (max. 10)
│   │   ├── hooks/
│   │   │   ├── useSessionState.ts   useState-kompatibler sessionStorage-Wrapper
│   │   │   └── useTeamContext.ts    Team-Kontext aus sessionStorage
│   │   └── components/              Alle Shared-UI-Komponenten:
│   │                                    Button, TextArea, Input, Select, Toggle,
│   │                                    Checkbox, RadioGroup, SegmentedControl,
│   │                                    FormField, Alert, Card/CardHeader/CardContent/CardFooter,
│   │                                    TabBar, Separator, EmptyState,
│   │                                    InlineError, LoadingSkeleton, ProgressBar,
│   │                                    Snackbar, ConfirmDialog, SettingsDialog,
│   │                                    PanelHeader, Accordion, Tooltip,
│   │                                    CoachPanel, HandoffBanner,
│   │                                    CopyButton, RevealButton, MarkdownOutput,
│   │                                    ScreenshotUpload, Badge, Chip, ThemeToggle
│   ├── services/
│   │   ├── prompts/                 System-Prompts pro Tool (story, goal, test, doc, text)
│   │   ├── claude.ts                Story Generator API-Calls
│   │   ├── textPolisher.ts          Text Polisher API-Calls
│   │   ├── testCaseGenerator.ts     Test Case Generator API-Calls
│   │   ├── docGenerator.ts          Doc Generator API-Calls
│   │   ├── goalGenerator.ts         Goal Generator API-Calls
│   │   ├── storage.ts               localStorage CRUD (Stories + Refinements)
│   │   └── testCaseStorage.ts       localStorage CRUD (Testpläne)
│   ├── hooks/                       useStory, useStories, useTextPolisher,
│   │                                useTestCaseGenerator, useDocGenerator,
│   │                                useGoalGenerator, useCopyToClipboard,
│   │                                useDebounce, useTestCasePlans
│   └── pages/                       AuthPage, ToolSelectionPage, WorkspacePage,
│                                    TextPolisherPage, TestCaseGeneratorPage,
│                                    DocGeneratorPage, GoalGeneratorPage, StoryPage
├── vitest.config.ts                 Haupt-Test-Konfiguration (jsdom, v8-coverage)
├── vitest.enterprise.config.ts      Enterprise-Pfad-Tests (VITE_TARGET=enterprise)
└── vite.config.ts                   Build-Config (base, envDir, plugin-react)
```

---

## Tool-Details

| Tool | max_tokens | Persistenz | Besonderheiten |
|---|---|---|---|
| **Story Generator** | 2048 | localStorage | AppShell (3-Panel), Refinement-Loop mit Hint-Paaren, `buildStoryConversationHistory()` in `claude.ts` |
| **Goal Generator** | 2000/1000, 6000/2000 | sessionStorage | 2 Tabs (sprint-goal/pi-objective), 2–3 Varianten + Refinement-Loop, `ConfirmDialog` bei Tab-Wechsel |
| **Text Polisher** | 2048 | sessionStorage | 3 Use Cases (email/meeting/freetext), Ton-Auswahl nur bei email, `ConfirmDialog` bei Use-Case-Wechsel |
| **Test Case Generator** | 4000 | localStorage (Pläne) | JSON-Output, Jira-Export, bis zu 3 Screenshots, Sidebar-History mit URL-Routing `/:id` |
| **Doc Generator** | 4000/6000 | — (ephemer) | 2 Modi (story/feature), Markdown-Output, Screenshots, `ConfirmDialog` bei Mode-Wechsel |

---

## Testing-Philosophie

**Was wird getestet:**
- Services: Business-Logik, API-Call-Parameter, Prompt-Aufbau, Parsing-Funktionen
- Hooks: Mutation-Erfolg/Fehler, Query-Verhalten, State-Übergänge
- Kritische Shared Services: `apiClient` (Sicherheit), `storage` + `testCaseStorage` (Quota), `withTimeout`
- Pages: Happy-Path, wichtige Error-States, ConfirmDialog-Interaktionen

**Was nicht Unit-getestet wird:**
- Rein visuelle Komponenten ohne Branch-Logik (`Accordion`, `Tooltip`, `Select`)
- Enterprise-Pfade in GitHub-Tests (IS_ENTERPRISE = false zur Compile-Zeit)
- Playwright deckt E2E-Pfade für kritische Flows ab

**Muster:**

```typescript
// Service-Tests: genau einen Mock-Einstiegspunkt
vi.mock('../shared/services/apiClient', () => ({
  getApiClient: () => ({ messages: { create: messagesCreateMock } }),
  extractTextContent: (content) => content.filter(b => b.type === 'text').map(b => b.text).join(''),
}));

// Page-Tests: QueryClientProvider-Wrapper
const makeWrapper = () => ({ children }) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);

// Auth-Credentials: via vitest.config.ts → test.env (kein vi.stubEnv nötig)
// Clipboard: Object.defineProperty(navigator, 'clipboard', ...)
// ConfirmDialog: screen.getByRole('alertdialog') — NICHT 'dialog'
```

**Coverage-Status (2026-06-22):** 634 Tests. Ziel: ≥ 80 % Branch für kritische Services.

---

## Deployment

### GitHub Pages (automatisch)

Trigger: Push zu `main` mit Änderungen in `apps/po-suite/**` oder manuell via `workflow_dispatch`.

```yaml
# .github/workflows/deploy.yml
build: npm run build             # tsc + vite (VITE_TARGET=github)
deploy: actions/deploy-pages@v4  # SPA-Routing: index.html → 404.html kopiert
```

Credentials (`VITE_AUTH_EMAIL`, `VITE_AUTH_PASSWORD`) kommen aus GitHub Secrets — nie committen.

### Enterprise (manuell via workflow_dispatch)

```bash
docker build --build-arg VITE_TARGET=enterprise --build-arg VITE_API_URL=https://... .
# → GHCR → OpenShift rollout
```

---

## Auth

**GitHub-Pages-Variante:** Statische Credentials aus `.env.local` (`VITE_AUTH_EMAIL` / `VITE_AUTH_PASSWORD`). Vite liest von `../../` (Repo-Root, `envDir: '../../'`). Bei fehlenden Vars: klarer Konfigurationsfehler.

**Enterprise-Variante:** Username/Password → POST `/api/auth/login` → JWT in sessionStorage (`ENTERPRISE_JWT_KEY`). API-Key liegt serverseitig.

**API-Key:** Nur im Login-Formular eingeben. Liegt in `sessionStorage('anthropic_api_key')`. Nie in `.env`. Details: [ADR-001](../../docs/adr/ADR-001-sessionstorage-api-key.md).

---

## Design-Tokens

CSS Custom Properties in `src/index.css`, referenziert via `rgb(var(--color-X) / <alpha-value>)` in `tailwind.config.ts`. Dark Mode via `[data-theme="dark"]` auf `<html>` — keine `dark:`-Präfixe in Komponenten.

```
Light:  brand #1C2B1E  /  canvas #F5F0E8  /  surface #FAFAF8
Dark:   brand #8FAF93  /  canvas #131816  /  surface #1C211D
ink #1C2420 / ink-secondary #5C5852 / ink-tertiary #6B6860
edge #DDD8CF / edge-2 #EBE6DA
error #dc2626 / success #16a34a (light) | #f87171 / #4ade80 (dark)
font-serif: Playfair Display  /  font-sans: Inter
```

Vollständige UI/UX-Dokumentation: [`docs/UI_UX.md`](../../docs/UI_UX.md).

---

## Bekannte Eigenheiten & offene Schulden

| Thema | Status |
|---|---|
| Story Generator abweichendes Layout (3-Panel statt 2-Screen) | Historisch gewachsen, Backlog |
| `httpClient.ts` Enterprise: nur via `vitest.enterprise.config.ts` getestet | P1-Schuld, keine isolierten Unit-Tests |
| `dangerouslyAllowBrowser: true` | Für Single-User-Prototyp akzeptiert; bei Rollout zu Enterprise-Backend migrieren |
| `packages/api-types` fehlt | Frontend- und Backend-Typen separat — Typ-Drift möglich (siehe [ADR-005](../../docs/adr/ADR-005-npm-workspaces-monorepo.md)) |
| `withTimeout` via Promise.race | Underlying API-Call läuft nach Timeout weiter — für GitHub-Build akzeptiert (siehe [ADR-004](../../docs/adr/ADR-004-vitest-statt-jest.md)) |

---

## Konventionen (Kurzreferenz)

| Was | Wie |
|---|---|
| Modell | `claude-sonnet-4-5`, `max_tokens` tool-spezifisch |
| API-Calls | nur via `getApiClient()` aus `shared/services/apiClient.ts` |
| Timeout | **alle** API-Calls via `withTimeout()` aus `shared/services/withTimeout.ts` (60 s) |
| System-Prompts | zentral in `services/prompts/[tool].ts` — kein Prompt im Service oder Hook |
| Storage-Keys | zentral in `shared/services/storageKeys.ts` — kein Hardcoding |
| Neues Tool | Prompt → Service → Hook → Komponenten → Page → `App.tsx` (lazy) → `constants/tools.tsx` |
| State-Pattern | `'input' \| 'output'` State-Machine (Vorbild TCG/DocGen) |
| Validierung | Submit-Button `disabled`, kein Toast/Alert |
| Felder | Immer `FormField` + `Input`/`TextArea` — nie rohes `<input>` oder `<textarea>` |
| Fehler (Feld) | `FormField error=`-Prop für feldgebundene Validierungsmeldungen |
| Fehler (Inline) | `InlineError` im Input-Screen und im Output-Panel bei Regenerierung |
| Fehler (kontextuell) | `Alert variant="error"` für nicht-feldgebundene Fehlerhinweise |
| Tabs / Panel-Navigation | `TabBar` (Arrow-Key-Navigation, ARIA-konform) |
| Kompakte Auswahl (≤4 Optionen) | `SegmentedControl` (kein Panel-Wechsel) |
| Dialoge | `ConfirmDialog` aus `shared/components` — kein `window.confirm()` |

---

## Claude Code Konfiguration

**Hooks** (`.claude/settings.json`):
- `SessionStart` → `session-start.sh` (npm install bei `CLAUDE_CODE_REMOTE=true`)
- `PostToolUse` → Test-Run nach `git commit`

**Slash Commands**: `/new-component` (React-Konventionen), `/new-service` (Service-Konventionen inkl. `withTimeout`-Pflicht).
