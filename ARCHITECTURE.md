# PO Suite — Architecture

## 1. Überblick

PO Suite ist eine KI-gestützte Produktivitäts-App für Product Owner in agilen Teams (Scrum / SAFe). Fünf Tools — Story Generator, Goal Generator, Test Case Generator, Doc Generator, Text Polisher — automatisieren wiederkehrende Schreibaufgaben.

Die App existiert in zwei Deployment-Varianten, die aus derselben Codebasis gebaut werden:

| Variante | Build-Flag | Auth | Persistenz | Deploy |
|---|---|---|---|---|
| **GitHub Pages** | `VITE_TARGET=github` (Default) | Env-Var-Credentials, API-Key im Browser | localStorage / sessionStorage | GitHub Actions → gh-pages |
| **Enterprise** | `VITE_TARGET=enterprise` | Username/Password → JWT | PostgreSQL via REST-API | Docker / OpenShift |

```
GitHub-Pages-Variante:
  Browser
    ├── React App ─→ Anthropic API (claude-sonnet-4-5)
    ├── sessionStorage → Auth-User + API-Key
    └── localStorage  → Stories + Refinements

Enterprise-Variante:
  Browser
    ├── React App ─→ Express Backend ─→ Anthropic API
    │                   ├── JWT-Middleware
    │                   └── PostgreSQL (Prisma)
    └── sessionStorage → JWT-Token
```

---

## 2. Tech Stack & Versionsstrategie

### Frontend (beide Varianten)

| Layer | Library | Version | Begründung |
|---|---|---|---|
| UI | React | 18 | Hooks, Concurrent Rendering, Suspense für Code-Splitting |
| Sprache | TypeScript | 5 | Strikte Typsicherheit, keine `any`-Casts toleriert |
| Build | Vite | 5 | Schneller Dev-Server, Rollup-basierter Production-Build |
| Routing | React Router | 6 | BrowserRouter + verschachtelte Routen + ProtectedLayout |
| Server-State | TanStack Query | 5 | `useMutation`/`useQuery` für API-Calls |
| Styling | Tailwind CSS | 3 | Eigene Design-Tokens, keine UI-Library |
| KI | @anthropic-ai/sdk | 0.90 | GitHub-Variante: Browser-fähig (`dangerouslyAllowBrowser: true`) |
| Markdown | react-markdown + rehype-sanitize | 9 / 6 | Default-Schema blockt `<script>`/`<iframe>` |
| Tests | Vitest + @testing-library/react + jsdom | 4 / 16 / — | 402 Tests, 39 Dateien |
| E2E | Playwright | 1.59 | Smoke-Tests, Chromium-only |

### Backend (Enterprise-Variante)

| Layer | Library | Begründung |
|---|---|---|
| Server | Express.js + TypeScript | Minimaler Overhead, gute Typisierung |
| ORM | Prisma | Typsichere DB-Queries, Migration-CLI |
| Datenbank | PostgreSQL | ACID, JSON-Felder für Hints |
| Auth | jsonwebtoken + bcrypt | JWT (HS256), bcrypt-Hashing der Passwörter |
| Validierung | Zod | Schema-Validierung aller Request-Bodies |
| Logging | pino | Strukturiertes JSON-Logging (`{ userId, tool, latency_ms, status }`) |

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

### Frontend

```
Pages          ─→  Hooks      ─→  Services / httpClient  ─→  Anthropic (GitHub)
  │                                                       ─→  Express Backend (Enterprise)
  │
  ├──→  Components (shared + tool-spezifisch)
  │
  └──→  Context (Auth)
         GitHub-Pfad:  liest API-Key aus sessionStorage → getApiClient()
         Enterprise:   liest JWT aus sessionStorage → fetchApi()
```

| Schicht | Verantwortung | Verweis |
|---|---|---|
| **Pages** | Routen-Komponenten, State-Machine `'input' \| 'output'` | `src/pages/` |
| **Hooks** | TanStack Query `useMutation`/`useQuery` um Service- bzw. HTTP-Funktionen | `src/hooks/` |
| **Services** | GitHub-Pfad: Anthropic API-Calls, Prompt-Building, Output-Parsing | `src/services/` |
| **httpClient** | Enterprise-Pfad: REST-Calls mit JWT, Timeout, 401-Handling | `src/shared/services/httpClient.ts` |
| **Components** | Reine Render-Komponenten, tool-spezifisch oder shared | `src/components/`, `src/shared/components/` |
| **Context** | Auth-State; Enterprise: login via POST /api/auth/login | `src/context/AuthContext.tsx` |
| **Constants** | Tool-Definitionen, Kategorie-Labels | `src/constants/tools.tsx` |

### Backend (Enterprise)

```
backend/src/
├── server.ts               Express-Einstiegspunkt, PORT=3000
├── middleware/
│   └── authenticate.ts     JWT-Verifikation → req.user = { userId, email }
├── routes/
│   ├── auth.ts             POST /api/auth/login
│   ├── tools.ts            10 Tool-Endpunkte (Proxy zu Anthropic)
│   ├── stories.ts          CRUD /api/stories
│   └── health.ts           GET /health
├── services/               Anthropic-Service-Logik (analog frontend/src/services/)
│   ├── claude.ts
│   ├── textPolisher.ts
│   ├── testCaseGenerator.ts
│   ├── docGenerator.ts
│   ├── goalGenerator.ts
│   └── prompts.ts
└── shared/
    ├── prisma.ts           PrismaClient-Singleton
    ├── apiClient.ts        Anthropic-Client (liest ANTHROPIC_API_KEY aus env)
    ├── logger.ts           pino-Logger
    └── imageBlocks.ts      Base64→ImageBlockParam-Builder
```

Detaillierter Datei-Baum: siehe [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

---

## 4. Datenfluss eines Tool-Calls

### GitHub-Pages-Variante

```
1. User klickt Submit in InputPanel
2. Page ruft Hook.mutate(input) auf
3. Hook ruft Service-Funktion (z.B. generateStory())
4. Service baut Prompt + ruft getApiClient().messages.create()
5. apiClient liest API-Key aus sessionStorage
6. Anthropic-Response → Output-Parsing (parseOutput, parseVariants, …)
7. localStorage-Persistenz via storage.ts (nur Story Generator)
8. TanStack Query setzt isPending → false, Komponenten re-rendern
```

### Enterprise-Variante

```
1. User klickt Submit in InputPanel
2. Page ruft Hook.mutate(input) auf
3. Hook ruft fetchApi('/api/tools/<endpoint>', body)
4. fetchApi liest JWT aus sessionStorage, setzt Authorization-Header
5. fetchWithTimeout (AbortController, 60 s) → Express Backend
6. Backend: authenticate() verifiziert JWT → checkUserRateLimit() (20 req/min)
7. Backend-Service → Anthropic API → Response
8. Backend speichert in PostgreSQL (Story Generator: atomar in tools.ts)
9. HTTP-Response → handleResponse() → TanStack Query → re-render
```

### Variationen pro Tool

| Tool-Typ | Besonderheit |
|---|---|
| Text-only (Story, Polisher, Goal-Sprint) | Direkter API-Call mit System + User-Prompt |
| Multimodal (TCG, DocGen, Goal-PI) | Screenshots via `buildImageBlocks()`, Base64 im Request-Body |
| Refinement-Loop (Story, Goal) | Conversation-History im Hook-State; weiterer Call mit erweiterten Messages |

---

## 5. Auth-Flow & Schlüssel-Management

### GitHub-Pages-Variante

```
Login    ─→  AuthContext prüft VITE_AUTH_EMAIL/PASSWORD
         │   bei Erfolg: sessionStorage.session_user gesetzt
         │   optional: sessionStorage.anthropic_api_key gesetzt
         │
SettingsDialog (TopNav) ─→ setApiKey(neuerKey) ─→ sessionStorage
         │
Logout   ─→  sessionStorage.clear()
             navigate('/auth')
```

### Enterprise-Variante

```
Login    ─→  POST /api/auth/login { email, password }
         │   Backend: bcrypt.compare() → JWT (HS256, 8h)
         │   sessionStorage.enterprise_jwt gesetzt (via setJwt())
         │
API-Call ─→  fetchApi() liest JWT → Authorization: Bearer <token>
         │   Backend: authenticate() → req.user = { userId, email }
         │
401      ─→  clearJwt() → on401() → redirect /auth
         │
Logout   ─→  clearJwt() → navigate('/auth')
```

### Bekannte Limitationen (GitHub-Variante)

- **Prototyp-Auth:** Single-User-Credentials aus `VITE_AUTH_EMAIL` / `VITE_AUTH_PASSWORD`, kein Code-Fallback.
- **`dangerouslyAllowBrowser: true`:** Anthropic SDK läuft direkt im Browser. Nur für persönliche Tools geeignet.
- **sessionStorage:** API-Key wird beim Tab-Schliessen verworfen.

---

## 6. State-Persistenz

### GitHub-Pages-Variante

| Speicher | Was wird gespeichert | Lebensdauer |
|---|---|---|
| `localStorage` (`sg_stories`, `sg_refinements`) | Stories und Refinements | Persistent |
| `sessionStorage` (`session_user`, `anthropic_api_key`) | Auth-User + API-Key | Bis Tab geschlossen |
| `sessionStorage` (`tp_*`) | Text Polisher: Use Case, Tone, Input, Output | Bis Tab geschlossen |
| React State | TCG, DocGen, Goal Generator: aktiver Input/Output | Bis Page-Wechsel |

### Enterprise-Variante

| Speicher | Was wird gespeichert | Lebensdauer |
|---|---|---|
| `sessionStorage` (`enterprise_jwt`) | JWT-Token | Bis Tab geschlossen / Ablauf (8h) |
| PostgreSQL (`Story`, `Refinement`) | Stories und Refinements | Persistent, user-isoliert |
| React State | TCG, DocGen, Goal Generator: aktiver Input/Output | Bis Page-Wechsel |

**Konvention:** Alle `sessionStorage`-Zugriffe laufen über `AuthContext`, `httpClient.ts` (`setJwt`/`clearJwt`) oder `useSessionState` — keine direkten Zugriffe in Komponenten.

---

## 7. Tool-Kontrakt

Ein neues Tool anzulegen folgt diesem Pfad:

1. **Service** (`src/services/<name>.ts`): Anthropic API-Call, Prompt, Output-Parsing
2. **Hook** (`src/hooks/use<Name>.ts`): `useMutation`-Wrapper
3. **Komponenten** (`src/components/<name>/`): Input-Panel + Output-Panel
4. **Page** (`src/pages/<Name>Page.tsx`): State-Machine `'input' | 'output'`
5. **Route** (`src/App.tsx`): `<Route path="/tools/<name>" element={<Page />} />`
6. **Definition** (`src/constants/tools.tsx`): Eintrag in `TOOLS[]`
7. **Backend-Endpunkt** (`backend/src/routes/tools.ts`): Zod-Schema + Handler (Enterprise)

Konventionen pro Schicht:

- Modell `claude-sonnet-4-5`, `max_tokens` aus der Tabelle in §2
- GitHub-Pfad: API-Calls **ausschliesslich** via `getApiClient()` aus `src/shared/services/apiClient.ts`
- Enterprise-Pfad: HTTP-Calls **ausschliesslich** via `fetchApi()` / `fetchApiGet()` aus `src/shared/services/httpClient.ts`
- Validierung: Submit-Button `disabled` wenn Pflichtfelder leer — **kein** Toast / Alert
- Fehler im Input-Screen: `<InlineError>` unter Submit
- Fehler im Output-Screen: `<InlineError>` im Output-Panel
- WCAG: `focus-visible:ring-2 focus-visible:ring-brand`, `aria-live="polite"` auf Output, `tabIndex={-1}` + Fokus-Programmierung nach Generierung

---

## 8. Build & Deploy

### GitHub-Pages-Build

```bash
cd frontend
VITE_TARGET=github npm run build  # oder ohne Flag (Default)
```

- `vite.config.ts` setzt `base: '/PO-Suite/'` wenn `VITE_TARGET !== 'enterprise'`
- Hauptbundle: ~211 kB ungzipped (gzip ~68 kB) dank Code-Splitting via `React.lazy()`

GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

```
push → main (frontend/** geändert)
  ├── npm ci + VITE_TARGET=github npm run build
  ├── cp dist/index.html dist/404.html
  └── peaceiris/actions-gh-pages → publish dist/ to gh-pages
```

### Enterprise-Build

```bash
# Lokale Entwicklung (alle Services)
docker compose up

# Einzelne Images bauen
docker build -t po-suite-backend ./backend
docker build -f frontend/Dockerfile.production -t po-suite-frontend ./frontend
```

**Docker-Images:**
- `backend/Dockerfile` — Multi-Stage: `node:20-alpine` Builder + Runtime (non-root `USER node`, Port 3000)
- `frontend/Dockerfile.production` — Multi-Stage: `node:20-alpine` Builder (`VITE_TARGET=enterprise`) + `nginx:1.27-alpine` Runtime (Port 8080, non-root)

**Prisma-Migrationen** laufen als Init-Container via `npx prisma migrate deploy` vor dem Backend-Start.

**OpenShift-Manifeste** unter `openshift/` (ConfigMap, Deployment, Service, Route, PVC). Secrets (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `DATABASE_URL`) werden via `oc create secret generic` bereitgestellt, nie committet.

CI/CD ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

```
push → main
  ├── Job: test         — npm run test:run (frontend) + tsc (backend)
  ├── Job: gh-pages     — GitHub-Pages-Build + Deploy
  └── Job: build-push   — Docker-Images bauen + GHCR pushen
```

---

## 9. Testing-Strategie

| Ebene | Tool | Was wird getestet | Status |
|---|---|---|---|
| Unit | Vitest | Service-Funktionen, Utilities, Markdown-Builder | ✅ alle Services |
| Unit | Vitest | Custom Hooks (mit `QueryClientProvider`) | ✅ alle Tool-Mutation-Hooks |
| Unit | Vitest | `httpClient` (fetchApi, fetchApiGet, fetchApiDelete, Timeout, 401) | ✅ |
| Integration | @testing-library/react | Komponenten + ARIA-Verhalten | ✅ Layout, Shell, Tool-Komponenten |
| Integration | @testing-library/react | Page-Flows (Submit → Output) | ✅ Auth, DocGen, TextPolisher, TCG, GoalGen |
| E2E | Playwright | Smoke-Tests | ✅ Login, Form-Felder, Skip-Link |

**Stand:** 402 Vitest-Tests in 39 Dateien + 3 Playwright-Smoke-Tests.

**Enterprise-Tests:** `vitest.enterprise.config.ts` setzt `VITE_TARGET=enterprise`, damit `IS_ENTERPRISE`-Branches abgedeckt sind.

```bash
npm run test:run       # GitHub-Pfad-Tests
npm run test:enterprise  # Enterprise-Pfad-Tests
npm run test:all       # beide
npm run test:coverage
npm run e2e
```

**Patterns:**
- **Service-Tests** mocken `getApiClient` via `vi.mock('shared/services/apiClient')` mit `messagesCreateMock`.
- **httpClient-Tests** mocken `fetch` via `vi.stubGlobal('fetch', ...)`.
- **Hook-Tests** wrappen `renderHook` mit `QueryClientProvider`.
- **Page-Tests** mocken den Service auf Modul-Ebene und `vi.spyOn(window, 'confirm')`.

---

## 10. Erweiterungspunkte & Roadmap

| Bereich | Status | Anmerkung |
|---|---|---|
| Code-Splitting via `React.lazy` | ✅ Erledigt | Hauptbundle ~211 kB |
| Tests für alle Services / Hooks | ✅ Erledigt | 402 Tests, 39 Dateien |
| Enterprise-Backend (Express + Prisma) | ✅ Erledigt | Alle 5 Tools + Story-CRUD + Auth |
| Docker / OpenShift-Manifeste | ✅ Erledigt | Non-root, SCC-konform, Init-Container |
| Dual-Build (`VITE_TARGET`) | ✅ Erledigt | GitHub-Build unverändert, Enterprise-Build via Adapter |
| E2E-Tests (Playwright) | Foundation | Smoke-Tests vorhanden; Tool-Happy-Paths ausstehend |
| Backend-Tests (Vitest + Supertest) | Ausstehend | Aktuell kein Test-Setup im Backend |
| Keycloak/OIDC | Optional | JWT-Middleware v2-Upgrade-Pfad |
| Internationalisierung | Nicht geplant | Aktuell DE-CH only |
| Re-Render-Optimierung | Bedarf-getrieben | useMemo/useCallback nur nach Profiler-Befund |

---

## Verwandte Dokumente

- [README.md](README.md) — Projektübersicht, Tech Stack, Schnellstart
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — Detaillierte Entwicklerdoku, Datei-Baum
- [UI-UX-Design.md](UI-UX-Design.md) — Design-Tokens, Komponentenbibliothek, WCAG
