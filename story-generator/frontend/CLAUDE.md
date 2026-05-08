# AI Tools — Frontend (PO Suite)

React 18 + TypeScript + Vite Single-Page-Application. Fünf Tools: **Story Generator** (User-Stories aus Anforderungen), **Goal Generator** (Sprint Goals & PI Objectives), **Text Polisher** (Rohtexte aufbereiten), **Test Case Generator** (Testpläne aus User Stories + Screenshots) und **Doc Generator** (fachtechnische Dokumentation für Confluence). Build läuft vollständig im Browser; kein Backend ausser der Anthropic API.

## Aktueller Stand

**Repo:** `larsjoss/PO-Suite` — **Hauptbranch:** `main`

**Alle fünf Module vollständig implementiert und getestet.** 260 Tests grün, Build sauber. Hauptbundle 211 kB durch Code-Splitting.

**GitHub Pages:** `https://larsjoss.github.io/PO-Suite/` — `vite.config.ts` hat `base: '/PO-Suite/'` (muss immer dem GitHub-Repo-Namen entsprechen). Deploy via GitHub Actions auf Push zu `main` (mit Änderung unter `story-generator/frontend/**`) oder manuell via `workflow_dispatch`.

**Wichtige Konventionen:**
- Modell überall: `claude-sonnet-4-5` — `max_tokens` tool-spezifisch (siehe pro-Tool-Sektionen unten)
- System-Prompts leben zentral in `services/prompts.ts` (Single source für Prompt-Engineering)
- API-Calls: ausschliesslich via `getApiClient()` aus `shared/services/apiClient.ts`
- Timeout: alle API-Calls via `withTimeout()` aus `shared/services/withTimeout.ts` (60 s default)
- Multimodale Bild-Blöcke: über `buildImageBlock()` / `buildImageBlocks()` / `uploadedFileToImageBlock()` aus `shared/services/imageBlocks.ts`
- sessionStorage-Keys: zentral in `shared/services/storageKeys.ts` exportiert (kein Hardcoding)
- Neues Tool anlegen: Prompt in `prompts.ts` → Service → Hook → Komponenten → Page → `App.tsx` Route (lazy) → `constants/tools.tsx` Eintrag
- `constants/tools.tsx` ist Single-Source-of-Truth für alle Tool-Definitionen (TopNav + ToolSelectionPage)
- State-Machine-Pattern für neue Tools: `'input' | 'output'` wie TCG/DocGenerator
- Pflichtfeld-Validierung: Submit-Button `disabled`, kein Toast/Alert
- Fehlerbehandlung: `InlineError` im Formular (Input-Screen) und im Output-Panel (bei Regenerierung)
- Keine direkten sessionStorage-Zugriffe in Komponenten — nur via `getApiClient()`, `AuthContext` oder `useSessionState`
- Routing: alle Pages lazy-loaded via `React.lazy()` in `App.tsx`, mit `Suspense`-Fallback
- WCAG 2.1 AA: `focus-visible:ring-2 ring-brand`, `aria-live="polite"` auf `<span>` im Button, `tabIndex={-1}` + `useEffect` für Output-Fokus

## Entwicklung

```bash
npm install
npm run dev      # Vite Dev-Server auf http://localhost:5173
npm run build    # tsc + Vite Production Build
npm run preview  # Build lokal vorschauen
```

## Stack

| Layer | Technologie |
|---|---|
| UI | React 18, TypeScript, JSX |
| Styling | Tailwind CSS v3 (eigene Design-Tokens) |
| Routing | React Router v6 |
| Server-State | TanStack Query v5 (Mutations + Query-Invalidierung) |
| API | @anthropic-ai/sdk (`dangerouslyAllowBrowser: true`) |
| Persistenz | localStorage (Stories), sessionStorage (Auth + API-Key) |
| Markdown | react-markdown + rehype-sanitize |

## Auth

Single-User-Prototype: gültige Credentials werden aus den Env-Vars `VITE_AUTH_EMAIL` und `VITE_AUTH_PASSWORD` gelesen (siehe `.env.example`). Sind die Vars nicht gesetzt, wirft Login einen klaren Konfigurationsfehler — kein Code-Fallback.

Login setzt `session_user` + optional `anthropic_api_key` in sessionStorage. Logout löscht beides. Der API-Key kann nachträglich über das Settings-Dialog in der TopNav geändert werden.

## Ordnerstruktur

```
src/
├── App.tsx                     Router + ProtectedLayout (TopNav + Outlet)
├── index.css                   Global: focus-visible, tabpanel-fade, summary
├── main.tsx                    ReactDOM root, QueryClient, Provider-Stack
├── types/index.ts              Story, User, RefinementLog, Response-Typen
│
├── context/
│   └── AuthContext.tsx         Auth-State, login/logout, setApiKey
│
├── shared/
│   ├── services/
│   │   ├── apiClient.ts        getApiClient(), extractTextContent()
│   │   ├── storageKeys.ts      API_KEY_SESSION_KEY, SESSION_USER_KEY (SDK-frei)
│   │   ├── withTimeout.ts      withTimeout() — Promise-Race mit 60 s default
│   │   └── imageBlocks.ts      buildImageBlock(), buildImageBlocks(), uploadedFileToImageBlock()
│   └── components/             Shared Component Library (siehe unten)
│
├── services/
│   ├── prompts.ts              Zentrale System-Prompts (alle 7 Prompts + buildEmailPolishPrompt)
│   ├── claude.ts               Story Generator API (generate, refineWithHints, refine, formatStoryMarkdown, parseOutput)
│   ├── textPolisher.ts         Text Polisher API (polishText, re-export von UseCase/Tone aus types)
│   ├── testCaseGenerator.ts    Test Case Generator API (multimodal, buildJiraMarkdown, buildSingleTcMarkdown)
│   ├── docGenerator.ts         Doc Generator API (multimodal, generateDoc)
│   ├── goalGenerator.ts        Goal Generator API (generateGoals, refineGoal, parseVariants, parseRefinedVariant)
│   └── storage.ts              localStorage CRUD für Stories + Refinements
│
├── hooks/
│   ├── useStory.ts             useStory, useGenerateStory, useRefineStoryWithHints, useRefineStory
│   ├── useStories.ts           useStories (Liste), useDeleteStory
│   ├── useTextPolisher.ts      usePolishText Mutation
│   ├── useTestCaseGenerator.ts useGenerateTestCases Mutation
│   ├── useDocGenerator.ts      useGenerateDoc Mutation
│   ├── useGoalGenerator.ts     useGenerateGoals, useRefineGoal Mutations
│   ├── useCopyToClipboard.ts   copy(text), copied-State mit auto-reset
│   ├── useDebounce.ts          useDebounce (debounced side-effect)
│   └── useSessionState.ts      sessionStorage-backed useState
│
├── constants/
│   └── tools.tsx               Single-Source-of-Truth: TOOLS[], ToolDef, CATEGORY_LABELS, CATEGORY_ORDER
│
├── pages/
│   ├── AuthPage.tsx            Login-Seite → /tools
│   ├── ToolSelectionPage.tsx   Kategorie-Sektionen + TileStrips (import aus constants/tools.tsx)
│   ├── WorkspacePage.tsx       Story Generator (3-Panel via AppShell)
│   ├── TextPolisherPage.tsx    Text Polisher (Split-View, Use-Case-Tabs)
│   ├── TestCaseGeneratorPage.tsx  Test Case Generator (2-Screen: Input → Output)
│   ├── DocGeneratorPage.tsx    Doc Generator (2-Screen: Input → Output)
│   └── GoalGeneratorPage.tsx   Goal Generator (2-Screen, 2-Tab: Sprint Goal / PI Objective)
│
└── components/
    ├── auth/LoginForm.tsx
    ├── layout/AppShell.tsx     3-Spalten Desktop + Mobile Tabs (fade-animiert)
    ├── layout/TopNav.tsx       Sticky, Underline-Tabs + Icons, Kontext-Label, aria-current
    ├── home/ToolTile.tsx       snap-start Tile (w-200px), hover:border-brand
    ├── home/TileStrip.tsx      snap-x Strip, ResizeObserver, Arrow-Buttons mit Gradient-Fade
    ├── sidebar/                Sidebar, SearchBox, StoryListItem
    ├── story/                  StoryInputPanel, StoryOutputPanel, InsightsPanel
    ├── text-polisher/          TextPolisherInputPanel, TextPolisherOutputPanel,
    │                           UseCaseSelector, ToneSelector
    ├── test-case-generator/    TestCaseInputPanel, TestCaseOutputPanel,
    │                           TestCaseCard, TestCaseSummaryBlock,
    │                           TestCaseFilterBar, constants.ts
    ├── doc-generator/          DocGeneratorInputPanel, DocGeneratorOutputPanel,
    │                           DocModeSelector
    └── goal-generator/         GoalTabSelector, SprintGoalInputPanel, PiObjectiveInputPanel,
                                GoalGeneratorOutputPanel, GoalVariantCard
```

## Shared Component Library

`src/shared/components/` — alle via Barrel-Export `index.ts` importierbar.

| Komponente | Props (Auswahl) | Verwendung |
|---|---|---|
| `Button` | `variant` (primary/secondary/outline/ghost), `size` (sm/md), `loading`, `disabled` | Überall |
| `TextArea` | `rows`, `autoGrow` (auto-height via scrollHeight), `disabled` | Input-Panels |
| `CopyButton` | `text`, `label` | StoryOutputPanel, TextPolisherOutputPanel (vollbreiter Primary-Button am Ende des Outputs) |
| `LoadingSkeleton` | `lines` | Output- und Insights-Panel |
| `InlineError` | `message` | Formulare, Output-Panels |
| `SettingsDialog` | `open`, `onClose` | TopNav |
| `MarkdownOutput` | `children: string` | Beide Output-Panels |
| `PanelHeader` | `title`, `id?`, `action?` (ReactNode) | Alle 5 Panels |
| `RevealButton` | `show`, `onToggle`, `label` | LoginForm, SettingsDialog |
| `ScreenshotUpload` | `files`, `onChange`, `disabled`, `maxFiles` | TestCaseInputPanel, DocGeneratorInputPanel (max 3 Story / max 1 Feature) |

## Design-Tokens (Tailwind)

```
brand        #1C2B1E  (dark green) / brand-dark / brand-light #E8EFE9
canvas       #F5F0E8  (Hintergrund Seiten)
surface      #FAFAF8  (Karten, Panels, Inputs)
ink          #1C2420  / ink-secondary #5C5852 / ink-tertiary #6B6860
edge         #DDD8CF  (Rahmen) / edge-2 #EBE6DA (hover-Flächen)
font-serif   Playfair Display (Überschriften)
font-sans    Inter (Fliesstext)
```

## API-Klient & Shared Service-Helpers

`src/shared/services/`:
- **`apiClient.ts`** — `getApiClient()` (liest `anthropic_api_key` aus sessionStorage, wirft bei fehlendem Key), `extractTextContent(content)` (filtert TextBlocks aus der Anthropic-Response)
- **`storageKeys.ts`** — `API_KEY_SESSION_KEY` und `SESSION_USER_KEY` als zentrale Konstanten (SDK-frei → kein Bundle-Pull-In bei Imports aus eager-loaded Code wie `AuthContext`)
- **`withTimeout.ts`** — `withTimeout(promise, ms = 60_000)` für alle API-Calls; wirft Fehlermeldung mit dynamischer Sekundenanzeige
- **`imageBlocks.ts`** — `buildImageBlock(base64, mediaType)`, `buildImageBlocks(uploads)`, `uploadedFileToImageBlock(uf)` — typisierte Anthropic-`ImageBlockParam`-Erzeugung für multimodale Calls

Alle Services importieren ausschliesslich `getApiClient()` für API-Zugriff — kein direkter sessionStorage-Zugriff in Komponenten oder Services.

## Story Generator

**Modell:** `claude-sonnet-4-5`, `max_tokens: 2048`

**Output-Format:** Markdown-Template mit fixen Sektionen (`**Titel**`, `**Ausgangslage**`, `**Akzeptanzkriterien**`, `**Weitere Informationen**`, `**Refinement Hinweise**`). Die Sektion `**Refinement Hinweise**` wird beim Parsen (`claude.ts: parseOutput`) vom Haupt-Story-Text abgetrennt und separat in `Story.refinementHints` gespeichert.

**Refinement-Flow:**
1. `useRefineStoryWithHints` — übergibt beantwortete Hint-Paare (Frage + Antwort)
2. `useRefineStory` — freie Instruktion, baut vollständige Conversation-History auf

**Persistenz:** localStorage (`sg_stories`, `sg_refinements`). Keys sind `crypto.randomUUID()`.

## Text Polisher

**Modell:** `claude-sonnet-4-5`, `max_tokens: 2048`

**Use Cases:** `email` (dynamischer System-Prompt mit Ton-Parameter), `meeting` (Protokoll-Format), `freetext` (Lektor-Modus). Die drei System-Prompts verbieten explizit das Erfinden von Inhalten; unklare Stellen werden mit `[Prüfen]` markiert.

**Ton-Auswahl** (`formell` / `neutral` / `informell`) ist nur beim `email` Use-Case sichtbar.

**Output-Formate:**
- `email`: `Betreff: [Zeile]` (Zeile 1), Leerzeile, dann Fliesstext-Body (Anrede + Haupttext + Grussformel + `[Absender]`). Kein Markdown, keine Labels.
- `meeting`: Markdown-Protokoll mit Abschnitten `**Datum**`, `**Teilnehmer**`, `**Kernpunkte**`, `**Beschlüsse**`, `**Next Steps**` — nur Abschnitte mit vorhandenen Infos.
- `freetext`: Bullet Points (`•`), jeder auf eigener Zeile mit nachfolgender Leerzeile.

## Test Case Generator

**Modell:** `claude-sonnet-4-5`, `max_tokens: 4000`

**Multimodal:** Akzeptiert bis zu 3 Screenshots (PNG/JPG/WebP, max. 5 MB) via `buildImageBlock()` aus `shared/services/imageBlocks.ts`.

**Timeout:** 60 Sekunden via `withTimeout()` aus `shared/services/withTimeout.ts`.

**Output:** JSON-Objekt (`TestPlan`) — kein Markdown. Code-Fence-Stripping im Parser (`/^```json\s*/i`).

**Input-Quellen:** `story_ak` (Pflichtfeld Story-Text), `screenshot` (optional), `test_context` (optionales Accordion).

**Export:** `buildJiraMarkdown(plan)` (vollständiger Plan), `buildSingleTcMarkdown(tc)` (einzelner TC).

**Filter:** Type-Chips + Level-Segmented-Control (interner State, kein Persist). "Alles kopieren" exportiert immer den ungefilterten Plan.

## Doc Generator

**Modell:** `claude-sonnet-4-5`, `max_tokens: 4000` (Story) / `6000` (Feature)

**Modi:** `story` (Story-Dokumentation) und `feature` (Feature-Dokumentation). Moduswahl via `DocModeSelector` (`role="tablist"`, Arrow-Key-Navigation).

**Multimodal:** Akzeptiert Screenshots via `buildImageBlocks()` (max. 3 für Story, max. 1 für Feature). Identisches Muster wie Test Case Generator.

**Timeout:** 60 Sekunden via `withTimeout()`.

**Output:** Reines Markdown (kein JSON-Parsing). Sektionen des Outputs werden durch optionale Felder gesteuert — leere optionale Felder im Input führen dazu, dass die entsprechenden Sektionen im Output weggelassen werden.

**Pflichtfelder:** Story = Titel + Beschreibung; Feature = Titel + Beschreibung + Enthaltene Stories. Submit-Button ist `disabled` bis Pflichtfelder gefüllt.

**Fehlerbehandlung:** API-Fehler auf Input-Screen via `InlineError` (unter Submit-Button). Fehler nach "Neu generieren" auf Output-Screen via `error`-Prop in `DocGeneratorOutputPanel` (unter dem "Neu generieren"-Button).

**Layout:** 2-Screen State-Machine (`'input' | 'output'`) — konsistent mit TCG. Mode-Wechsel mit `window.confirm()` wenn Eingaben vorhanden.

**Typen:** `DocMode`, `StoryDocInput`, `FeatureDocInput`, `GenerateDocParams` (Discriminated Union) in `src/types/index.ts`.

**Service:** `src/services/docGenerator.ts` — `generateDoc()` (interne Builder `buildStoryText`/`buildFeatureText` für User-Messages).

**Hook:** `src/hooks/useDocGenerator.ts` — `useGenerateDoc()` (TanStack Query `useMutation`).

## Goal Generator

**Modell:** `claude-sonnet-4-5`

**Modi:** `sprint-goal` (`max_tokens: 2000` Generate / `1000` Refine, optionaler Backlog-Screenshot) und `pi-objective` (`max_tokens: 6000` Generate / `2000` Refine, kein Screenshot).

**Output:** 2–3 Varianten mit Qualitätsbegründung und optionaler Schwachstelle. Parser `parseVariants()` teilt am `Variante N`-Header auf, behandelt PI-Objective-Format mit `---` Separator. `parseRefinedVariant()` für single-Variant-Refinement-Responses.

**Refinement-Loop:** Gewählte Variante + Hinweis → neue Variante mit identischer Struktur. Conversation-History wird im Hook-State gehalten und an den nächsten Refinement-Call angehängt.

**Service:** `src/services/goalGenerator.ts` — `generateGoals()`, `refineGoal()`, `parseVariants()`, `parseRefinedVariant()`.

**Hook:** `src/hooks/useGoalGenerator.ts` — `useGenerateGoals()`, `useRefineGoal()`.

## Accessibility (WCAG 2.1 AA)

- Skip-Link auf `#main-content` (App.tsx, erstes fokussierbares Element)
- `<header aria-label>`, `<main id="main-content">`, `role="region"` auf Output-Panels
- `role="tablist/tab"` in AppShell (Mobile), UseCaseSelector; Arrow-Key-Navigation
- `role="radiogroup/radio"` in ToneSelector; Arrow-Key-Navigation
- `role="alert" aria-live="assertive"` auf InlineError
- `role="status" aria-live="polite"` auf LoadingSkeleton und Refinement-Banner
- Programmatischer Fokus nach Generierung (beide Output-Panels, `tabIndex={-1}`)
- `RevealButton`: `min-h-[44px] min-w-[44px]` (WCAG 2.5.5 Touch Target)
- Fokus-Ring: weiss (`ring-white`) auf dunklem Brand-Hintergrund (ToneSelector aktiver Button)

## Tests

Vitest + @testing-library/react + jsdom. Konfiguration: `vitest.config.ts`, Setup: `src/test/setup.ts`.

```bash
npm test              # Single-Run (npm run test:run als Alias)
npm run test:watch    # Watch-Mode
npm run test:coverage # Coverage-Report
```

| Datei | Was getestet |
|---|---|
| `claude.test.ts` | `parseOutput` — Story/Hints-Trennung |
| `storage.test.ts` | localStorage CRUD für Stories + Refinements |
| `testCaseGenerator.test.ts` | `buildJiraMarkdown`, `buildSingleTcMarkdown`, `getAvailableTypes/Levels` |
| `docGenerator.test.ts` | Mode-Routing (story=4000/feature=6000), User-Message-Mapping, Multimodal, Empty-Response-Errors |
| `goalGenerator.test.ts` | `parseVariants` (Sprint + PI), `parseRefinedVariant`, `generateGoals` Mode-Routing, `refineGoal` Conversation-History |
| `useCopyToClipboard.test.ts` | copied-State, Timeout, Clipboard-API |
| `UseCaseSelector.test.tsx` | Tab-Rendering, ARIA, Keyboard-Navigation |
| `ToneSelector.test.tsx` | Radio-Gruppe, ARIA, Keyboard-Navigation |
| `ScreenshotUpload.test.tsx` | Upload, Validierung, Remove, ARIA |
| `TestCaseCard.test.tsx` | Stammdaten, Flags, Copy |
| `TestCaseFilterBar.test.tsx` | Typ-Filter, Level-Filter, Ergebnis-Zähler |
| `DocModeSelector.test.tsx` | Tab-Rendering, ARIA, Keyboard-Navigation (ArrowLeft/Right/Home/End) |
| `DocGeneratorInputPanel.test.tsx` | Pflichtfelder Story/Feature, Ladezustand, Fehleranzeige, Moduswechsel |
| `DocGeneratorOutputPanel.test.tsx` | Loading-/Output-/Error-Zustand, Buttons, A11y (aria-live, aria-busy, tabIndex) |
| `GoalGeneratorOutputPanel.test.tsx` | Variants-View, Refining-View, mode-spez. Rendering, Copy, A11y |

**Service-Tests** mocken `getApiClient` via `vi.mock('shared/services/apiClient')` mit gemeinsamem `messagesCreateMock`.

**Output-Panel-Tests** für Copy-Funktionalität: `Object.defineProperty(navigator, 'clipboard', ...)` + `fireEvent.click` (umgeht userEvents Clipboard-Override).

**Gesamt: 260 Tests in 18 Test-Dateien**

## Claude Code Konfiguration

**Hooks** (`.claude/settings.json`):

| Hook | Auslöser | Aktion |
|---|---|---|
| `SessionStart` | Sitzungsstart | `session-start.sh` — führt `npm install` aus, wenn `CLAUDE_CODE_REMOTE=true` |
| `PostToolUse` | Bash-Call mit `git commit*` | Automatischer Test-Run nach Commit; Ergebnis als `systemMessage` |

**Slash Commands** (`.claude/commands/`):

| Command | Zweck |
|---|---|
| `/new-component` | Konventionen für neue React-Komponenten (Design-Tokens, ARIA, Imports) |
| `/new-service` | Konventionen für neue API-Services (`getApiClient()`, Modell, max_tokens, Parsing) |

## Bekannte Einschränkungen

- **Auth ist ein Prototype**: Credentials werden strikt aus `VITE_AUTH_EMAIL` / `VITE_AUTH_PASSWORD` gelesen — kein Code-Fallback. Bei fehlenden Env-Vars wirft Login einen Konfigurationsfehler. Für Multi-User-Betrieb durch echte Authentifizierung ersetzen (Supabase empfohlen).
- **API-Key im Browser**: `dangerouslyAllowBrowser: true` — nur für Single-User-Prototypen geeignet.
- **Text Polisher Zustand**: Wird via `useSessionState` in sessionStorage persistiert — bleibt innerhalb einer Browser-Session erhalten, wird beim Tab-Schliessen verworfen.
- **Test Case Generator Zustand**: Ephemer (kein Persist). Screenshots sind nicht JSON-serialisierbar; State lebt nur in der aktuellen Page-Instanz.
