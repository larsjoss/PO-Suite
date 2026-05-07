# PO Suite — Architecture

## 1. Überblick

PO Suite ist eine browser-only Single-Page-Application für Product Owner in agilen Teams (Scrum / SAFe). Fünf KI-gestützte Tools — Story Generator, Goal Generator, Test Case Generator, Doc Generator, Text Polisher — automatisieren wiederkehrende Schreibaufgaben direkt im Browser. Der Anthropic API-Key bleibt beim Nutzer in `sessionStorage`, es gibt keinen Backend-Service.

```
Browser
  │
  ├── React App ─→ Anthropic API (claude-sonnet-4-5)
  │
  ├── sessionStorage  →  Auth-User + API-Key (sessionweit)
  └── localStorage    →  Stories + Refinements (persistent)
```

Die App ist auf GitHub Pages deployed (`https://larsjoss.github.io/PO-Suite/`) und benötigt für den Betrieb nichts weiter als einen gültigen Anthropic API-Key.

---

## 2. Tech Stack & Versionsstrategie

| Layer | Library | Version | Begründung |
|---|---|---|---|
| UI | React | 18 | Hooks, Concurrent Rendering, Suspense für Code-Splitting |
| Sprache | TypeScript | 5 | Strikte Typsicherheit, keine `any`-Casts toleriert |
| Build | Vite | 5 | Schneller Dev-Server, Rollup-basierter Production-Build |
| Routing | React Router | 6 | BrowserRouter + verschachtelte Routen + ProtectedLayout |
| Server-State | TanStack Query | 5 | `useMutation` für API-Calls, kein Server-Cache nötig |
| Styling | Tailwind CSS | 3 | Eigene Design-Tokens, keine UI-Library |
| KI | @anthropic-ai/sdk | 0.90 | Browser-fähig (`dangerouslyAllowBrowser: true`) |
| Markdown | react-markdown + rehype-sanitize | 9 / 6 | Default-Schema blockt `<script>`/`<iframe>` |
| Tests | Vitest + @testing-library/react + jsdom | 4 / 16 / — | 189 Tests, 14 Dateien |

**Modell:** Alle Services nutzen `claude-sonnet-4-5`. `max_tokens` ist tool-spezifisch:

| Tool | max_tokens | Begründung |
|---|---|---|
| Story Generator | 2048 | Strukturierte User Story |
| Text Polisher | 2048 | Email/Meeting-Notiz/Freitext |
| Test Case Generator | 4000 | JSON-TestPlan, multimodal |
| Doc Generator (Story) | 4000 | Markdown-Doku |
| Doc Generator (Feature) | 6000 | Längere Feature-Doku |
| Goal Generator (Sprint) | 2000 / 1000 | Generate / Refine |
| Goal Generator (PI) | 6000 / 2000 | Generate / Refine |

---

## 3. Modulare Struktur

```
Pages          ─→  Hooks      ─→  Services   ─→  apiClient  ─→  Anthropic
  │                                                    ↑
  │                                                    │
  ├──→  Components (shared + tool-spezifisch)          │
  │                                                    │
  └──→  Context (Auth + API-Key)  ────────────────────┘
                                  liest API-Key aus sessionStorage
```

| Schicht | Verantwortung | Verweis |
|---|---|---|
| **Pages** | Routen-Komponenten, State-Machine `'input' \| 'output'`, orchestrieren Hooks und Komponenten | `src/pages/` |
| **Hooks** | TanStack Query `useMutation`-Wrapper um Service-Funktionen | `src/hooks/` |
| **Services** | Anthropic API-Calls, Prompt-Building, Output-Parsing | `src/services/` |
| **Components** | Reine Render-Komponenten, tool-spezifisch oder shared | `src/components/`, `src/shared/components/` |
| **Context** | Auth-State, API-Key-Setzen | `src/context/AuthContext.tsx` |
| **Constants** | Tool-Definitionen, Kategorie-Labels | `src/constants/tools.tsx` |

Detaillierter Datei-Baum: siehe [`story-generator/frontend/CLAUDE.md`](story-generator/frontend/CLAUDE.md).

---

## 4. Datenfluss eines Tool-Calls

Beispiel: Story Generator generiert eine User Story.

```
1. User klickt Submit in StoryInputPanel
2. WorkspacePage ruft useGenerateStory().mutate(input) auf
3. Hook ruft generate() in services/claude.ts
4. Service baut Prompt + ruft getApiClient().messages.create()
5. apiClient liest VITE_… nicht — er liest API-Key aus sessionStorage
6. Anthropic-Response wird durch parseOutput() aufgeteilt:
   - Story-Text → state
   - Refinement-Hinweise → separates Feld
7. localStorage-Persistenz via storage.ts
8. TanStack Query setzt isPending → false, Komponenten re-rendern
```

### Variationen pro Tool

| Tool-Typ | Besonderheit |
|---|---|
| Text-only (Story, Polisher, Goal-Sprint) | Direkter `messages.create()`-Call mit System + User-Prompt |
| Multimodal (TCG, DocGen, Goal-PI) | Screenshots als Base64-`ImageBlockParam[]` zusätzlich, `Promise.race` mit 60-s-Timeout |
| Refinement-Loop (Story, Goal) | Conversation-History wird im State gehalten; weiterer `messages.create()`-Call mit erweiterten Messages |

---

## 5. Auth-Flow & Schlüssel-Management

```
Login    ─→  AuthContext prüft VITE_AUTH_EMAIL/PASSWORD
         │   bei Erfolg: sessionStorage.session_user gesetzt
         │   optional: sessionStorage.anthropic_api_key gesetzt
         │
SettingsDialog (TopNav)   ─→ setApiKey(neuerKey)  ─→  sessionStorage
         │
Logout   ─→  sessionStorage.clear() (beide Keys)
         │   user-State zurückgesetzt
         │   navigate('/auth')
```

### Bekannte Limitationen

- **Prototyp-Auth:** Hardcodierte Single-User-Credentials via Environment-Variablen, kein Multi-User-Support, kein Passwort-Hashing.
- **`dangerouslyAllowBrowser: true`:** Anthropic SDK läuft direkt im Browser. Geeignet für persönliche Tools, **nicht** für Multi-User-Dienste — der API-Key ist im Browser-Memory zugänglich.
- **sessionStorage:** API-Key wird beim Tab-Schliessen verworfen. XSS-Risiko in Theorie; aktuell kein bekannter Vektor (`rehype-sanitize` blockt `<script>`).

---

## 6. State-Persistenz

| Speicher | Was wird gespeichert | Lebensdauer |
|---|---|---|
| `localStorage` (`sg_stories`, `sg_refinements`) | Stories und Refinements (Story Generator) | Persistent bis manuell gelöscht |
| `sessionStorage` (`session_user`, `anthropic_api_key`) | Auth-User + API-Key | Bis Tab geschlossen |
| `sessionStorage` (`tp_*`) | Text Polisher: Use Case, Tone, Input, Output | Bis Tab geschlossen |
| React State (in-memory) | Test Case Generator, Doc Generator, Goal Generator: aktiver Input/Output | Bis Page-Wechsel |
| TanStack Query | Server-State der laufenden Mutationen | Auto-cleared nach Erfolg |

**Konvention:** Alle `sessionStorage`-Zugriffe gehen über `apiClient.ts`, `AuthContext.tsx` oder `useSessionState.ts` — keine direkten Zugriffe in Komponenten. Alle `localStorage`-Zugriffe gehen über `services/storage.ts`.

---

## 7. Tool-Kontrakt

Ein neues Tool anzulegen folgt diesem Pfad:

1. **Service** (`src/services/<name>.ts`): Anthropic API-Call, Prompt, Output-Parsing
2. **Hook** (`src/hooks/use<Name>.ts`): `useMutation`-Wrapper
3. **Komponenten** (`src/components/<name>/`): Input-Panel + Output-Panel
4. **Page** (`src/pages/<Name>Page.tsx`): State-Machine `'input' | 'output'`
5. **Route** (`src/App.tsx`): `<Route path="/tools/<name>" element={<Page />} />`
6. **Definition** (`src/constants/tools.tsx`): Eintrag in `TOOLS[]` mit Icon, Kategorie, Beschreibung

Konventionen pro Schicht:

- Modell `claude-sonnet-4-5`, `max_tokens` aus der Tabelle in §2
- API-Calls **ausschliesslich** via `getApiClient()` aus `src/shared/services/apiClient.ts`
- Validierung: Submit-Button `disabled` wenn Pflichtfelder leer — **kein** Toast / Alert
- Fehler im Input-Screen: `<InlineError>` unter Submit
- Fehler im Output-Screen: `<InlineError>` im Output-Panel
- WCAG: `focus-visible:ring-2 focus-visible:ring-brand`, `aria-live="polite"` auf Output, `tabIndex={-1}` + Fokus-Programmierung nach Generierung

---

## 8. Build & Deploy

### Build

```
npm run build  =  tsc (Type-Check)  →  vite build
```

- Vite `base: '/PO-Suite/'` muss immer dem GitHub-Repo-Namen entsprechen
- Aktuelles Hauptbundle: ~537 kB ungzipped (Vite warnt bei > 500 kB)
- Geplant: Code-Splitting via `React.lazy()` für die fünf Tool-Pages

### Deploy

GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

```
push → main (story-generator/frontend/** geändert)
  ├── checkout, setup-node
  ├── npm ci + npm run build
  ├── cp dist/index.html dist/404.html  (SPA-Routing, Deep-Links)
  └── peaceiris/actions-gh-pages → publish dist/ to gh-pages branch
```

Ergebnis: `https://larsjoss.github.io/PO-Suite/`

---

## 9. Testing-Strategie

| Ebene | Tool | Was wird getestet | Status |
|---|---|---|---|
| Unit | Vitest | Service-Funktionen, Utilities, Markdown-Builder | Teilweise — `claude.ts`, `storage.ts`, `testCaseGenerator.ts` haben Tests; `docGenerator.ts`, `goalGenerator.ts`, `textPolisher.ts` fehlen |
| Unit | Vitest | Custom Hooks (mit `QueryClientProvider`-Wrapper) | Nur `useCopyToClipboard` getestet — alle Tool-Hooks fehlen |
| Integration | @testing-library/react | Komponenten + ARIA-Verhalten | 14 Komponenten-Tests, fokus auf `getByRole` / `getByText` |
| Integration | @testing-library/react | Page-Flows (Submit → Output) | Aktuell **keine** Page-Tests |
| E2E | Playwright (geplant) | Login → Tool-Auswahl → Happy Path pro Tool | Aktuell **kein** E2E-Setup |

**Coverage-Ziele**

- Services: 100 % Branch-Coverage (jede Funktion mind. ein Happy- und ein Error-Test)
- Hooks: alle Tool-Hooks mit Mock-Service
- Komponenten: kritische ARIA-Pfade + User-Behavior
- Pages: mind. 3 Szenarien (Happy Path, Validierung, API-Fehler)

Testlauf:

```
npm test          # einmaliger Vitest-Run
npm run test:watch
npm run test:coverage
```

---

## 10. Erweiterungspunkte & Roadmap

| Bereich | Status | Anmerkung |
|---|---|---|
| Echtes Auth (z. B. Supabase) | Geplant | Aktuell: hardcodierte Single-User-Credentials |
| Code-Splitting via `React.lazy` | Geplant | Hauptbundle > 500 kB |
| Tests für ungetestete Services / Hooks | Geplant | docGenerator, goalGenerator, textPolisher, alle Tool-Hooks |
| E2E-Tests (Playwright) | Geplant | Smoke-Test für Login + Happy Path |
| Backend-Migration | Optional | Nur falls Anthropic-Key serverseitig laufen muss (Multi-User) |
| Internationalisierung | Nicht geplant | Aktuell DE-CH only |

---

## Verwandte Dokumente

- [README.md](README.md) — Projektübersicht, Tech Stack, Schnellstart
- [story-generator/frontend/CLAUDE.md](story-generator/frontend/CLAUDE.md) — Detaillierte Entwicklerdoku, Datei-Baum
- [UI-UX-Design.md](UI-UX-Design.md) — Design-Tokens, Komponentenbibliothek, WCAG
