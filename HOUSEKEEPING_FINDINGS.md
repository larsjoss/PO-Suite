# HOUSEKEEPING FINDINGS — PO Suite

**Datum:** 2026-06-05  
**Baseline:** 541 Tests grün (51 Dateien)  
**Scope:** `apps/po-suite/src/`, `apps/backend/src/`

---

## Struktur-Übersicht (3 Ebenen)

```
PO-Suite/
├── apps/
│   ├── backend/                 Express + Prisma + PostgreSQL
│   │   ├── prisma/              DB-Schema
│   │   ├── scripts/             Utility (create-user.ts)
│   │   └── src/
│   │       ├── middleware/
│   │       ├── routes/          API-Endpunkte (auth, tools, stories, health)
│   │       ├── services/        Claude-Services + prompts.ts (einzelne Datei)
│   │       ├── shared/          apiClient, errors, logger, imageBlocks
│   │       └── test/
│   └── po-suite/                React 18 + Vite Frontend
│       ├── e2e/                 Playwright (10 Tests)
│       └── src/
│           ├── components/      Tool-Komponenten (5 Ordner + shared + layout …)
│           ├── constants/       tools.tsx — zentrales Tool-Inventar
│           ├── context/         Auth + Theme
│           ├── hooks/           useXxx.ts pro Tool + Enterprise-Variante
│           ├── pages/           Seiten pro Tool + Workspace
│           ├── services/        Claude-Services + prompts/ (Unterordner pro Tool)
│           ├── shared/          Wiederverwendbare Komponenten, Hooks, Services, Types
│           └── types/           index.ts — zentrale Typen
├── openshift/                   Deployment-Konfigs
└── [Konfig-Dateien]
```

### Beobachtungen zur Struktur

| Beobachtung | Details |
|---|---|
| **Doppelstruktur `shared/`** | Backend hat `/backend/src/shared/`, Frontend hat `/po-suite/src/shared/` — nicht verbunden |
| **Prompts-Organisation unterschiedlich** | Frontend: `services/prompts/` Unterordner pro Tool; Backend: eine monolithische `prompts.ts` |
| **Zentrale Typen nur im Frontend** | `types/index.ts` zentralisiert alles — Backend hat eigene inline-Typen in Services |
| **`IS_ENTERPRISE` Flag** | 10-mal separat deklariert (jede Hook/Komponente definiert es selbst) |
| **`API_BASE` Konstante** | 2-mal deklariert: `httpClient.ts` + `AuthContext.tsx` |

---

## 🔴 SOFORT — Jetzt bereinigen

### R1 — `IS_ENTERPRISE` Flag: 10 separate Deklarationen → 1 shared export

**Problem:** `const IS_ENTERPRISE = import.meta.env.VITE_TARGET === 'enterprise'` steht wortgleich in 10 Dateien.

**Betroffene Dateien:**
- `src/context/AuthContext.tsx:6`
- `src/components/auth/LoginForm.tsx:6`
- `src/components/layout/TopNav.tsx:8`
- `src/hooks/useStory.ts:10`
- `src/hooks/useStories.ts:6`
- `src/hooks/useGoalGenerator.ts:13`
- `src/hooks/useDocGenerator.ts:8`
- `src/hooks/useTestCaseGenerator.ts:10`
- `src/hooks/useTextPolisher.ts:8`
- `src/pages/TestCaseGeneratorPage.tsx:15`

**Fix:** Export aus `src/shared/config/env.ts` (neue Datei), überall importieren.

**Risiko:** Gering — rein mechanisches Refactoring, nur Import-Zeile ändert sich.

---

### R2 — `API_BASE` Konstante: 2 separate Deklarationen

**Problem:** `const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` steht in:
- `src/shared/services/httpClient.ts:3`
- `src/context/AuthContext.tsx:7`

**Fix:** `AuthContext.tsx` importiert aus `httpClient.ts` (oder umgekehrt aus `env.ts`).

**Risiko:** Gering — Änderung in `AuthContext.tsx`, Tests prüfen das Verhalten.

---

### R3 — `po-theme` Storage-Key: direkt hardcodiert, nicht in `storageKeys.ts`

**Problem:** In `ThemeContext.tsx` steht `'po-theme'` als String-Literal, obwohl alle anderen Keys zentral in `storageKeys.ts` liegen.

**Betroffene Datei:**
- `src/context/ThemeContext.tsx:14` und `:19`

**Fix:** `THEME_KEY = 'po-theme'` zu `storageKeys.ts` hinzufügen, in `ThemeContext.tsx` importieren.

**Risiko:** Minimal.

---

## 🟡 BACKLOG — Legitime Issues, kein akuter Blocker

### B1 — Modellname + Token-Counts: 14 hardcodierte Instanzen

**Problem:** `'claude-sonnet-4-5'` und `max_tokens: 2048` (bzw. 4000/6000) sind in jedem Service-File einzeln hardcodiert — in Frontend und Backend je 7 mal.

**Dateien (Frontend):**
- `services/claude.ts` — 3×
- `services/goalGenerator.ts` — 2×
- `services/docGenerator.ts` — 1×
- `services/textPolisher.ts` — 1×

**Dateien (Backend):**
- `services/claude.ts` — 3×
- `services/goalGenerator.ts` — 2×
- `services/docGenerator.ts` — 1×
- `services/textPolisher.ts` — 1×

**Fix:** `src/shared/config/modelConfig.ts` mit `CLAUDE_MODEL`, `DEFAULT_MAX_TOKENS`, `DOC_MAX_TOKENS` etc. Parallel im Backend `src/shared/modelConfig.ts`.

**Priorität:** Niedrig — im Moment konsistent, Änderungsrisiko beim nächsten Modellwechsel.

---

### B2 — Typ-Duplikate zwischen Backend und Frontend

**Problem:** 9 Typen sind identisch in beiden Apps definiert, ohne shared package.

| Typ | Backend | Frontend |
|---|---|---|
| `Tone` | `services/prompts.ts:11` | `types/index.ts:38` |
| `UseCase` | `services/prompts.ts:5` | `types/index.ts:37` |
| `DocMode` | `services/docGenerator.ts:7` | `types/index.ts:127` |
| `GoalMode` | `services/goalGenerator.ts:7` | `types/index.ts:155` |
| `StoryDocInput` | `services/docGenerator.ts:9` | `types/index.ts:129` |
| `FeatureDocInput` | `services/docGenerator.ts:18` | `types/index.ts:138` |
| `SprintGoalInput` | `services/goalGenerator.ts:9` | `types/index.ts:157` |
| `PiObjectiveInput` | `services/goalGenerator.ts:13` | `types/index.ts:161` |
| `ImageMedia` | `shared/imageBlocks.ts:3` | `shared/services/imageBlocks.ts:4` |

**Achtung:** `FeatureDocInput` weicht ab — Frontend hat `decisions: string`, Backend nicht.  
Das ist ein potenzieller API-Vertrags-Bug (Backend ignoriert das Feld stillschweigend).

**Fix:** Shared-Package oder manuelle Sync-Review bei Typ-Änderungen.

---

### B3 — Service-Duplizierung Frontend ↔ Backend

**Problem:** 5 Service-Dateien existieren je einmal im Frontend und einmal im Backend mit ~50-85% identischer Logik.

| Service | Overlap | Differenz |
|---|---|---|
| `textPolisher.ts` | ~85% | Context-Parameter im Frontend |
| `claude.ts` | ~70% | Frontend hat `formatStoryMarkdown()` |
| `docGenerator.ts` | ~60% | Frontend hat `decisions`-Feld |
| `goalGenerator.ts` | ~50% | Frontend hat umfangreicheres Parsing |
| `testCaseGenerator.ts` | ~40% | Frontend hat Jira-Export-Logik |

**Kontext:** Diese Duplizierung ist **architekturell begründet** (Dual-Build: kein Backend vs. Enterprise). Kein sofortiger Handlungsbedarf, aber Maintenance-Last.

---

### B4 — `FeatureDocInput.decisions` fehlt im Backend

**Problem:** Backend's `FeatureDocInput` hat kein `decisions: string` Feld, das Frontend sendet es aber. Das Feld wird serverseitig stillschweigend ignoriert.

**Betroffene Datei:** `apps/backend/src/services/docGenerator.ts`

**Fix:** Feld im Backend-Typ ergänzen und in den Prompt einbauen.

---

## 🟢 OK — Bewusste Entscheidung, kein Handlungsbedarf

| Thema | Begründung |
|---|---|
| **Keine `console.*` im Produktivcode** | 4 Statements nur in `scripts/create-user.ts` (CLI-Utility) — korrekt |
| **Keine TODO/FIXME-Kommentare** | Sauber — keine offenen Baustellen im Code |
| **Kein auskommentierter Code** | Alle Kommentar-Blöcke sind Sektion-Header oder Erklärungen |
| **`sessionStorage` direkt in Services** | `handoffService.ts`, `apiClient.ts`, `httpClient.ts` — Services kapseln Storage korrekt |
| **`localStorage` in Hooks/Contexts** | `useTeamContext`, `useCoachVisibility`, `ThemeContext` — alle nutzen Konstanten aus `storageKeys.ts` (**Ausnahme: `po-theme` → R3**) |
| **Separate `.enterprise.test.ts`-Dateien** | Bewusste Test-Strategie für Dual-Build |
| **`IS_ENTERPRISE` als Compile-Time-Constant** | Vite-Tree-Shaking entfernt den toten Pfad — Pattern ist korrekt, nur Deklaration unnötig dupliziert |
| **Backend und Frontend `shared/` getrennt** | Kein shared npm-Package — bewusste Entscheidung, solange Monorepo klein bleibt |
| **Prompts in separaten Dateien (Frontend)** | Explizit in CLAUDE.md als Konvention dokumentiert |

---

## Zusammenfassung

| Kategorie | Anzahl Findings |
|---|---|
| 🔴 SOFORT | 3 |
| 🟡 BACKLOG | 4 |
| 🟢 OK | 9 |

**Sofort-Items (R1–R3) sind rein mechanische Konsolidierungen** — kein Verhaltens-Risiko, kein Produktivcode-Impact. Sie machen das Codebase konsequenter ohne Scope-Creep.

**Warte auf Bestätigung:** Welche 🔴-Items soll ich angehen?
