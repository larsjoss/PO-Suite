# PO Suite — Claude Code Guide

## Repository-Übersicht

npm-Workspaces-Monorepo mit zwei Apps unter `apps/`:
- `apps/po-suite/` (React 18 + TypeScript + Vite) — wird als **GitHub Pages** Single-User-Build *und* als **Enterprise**-Build (gegen Backend) ausgeliefert
- `apps/backend/` (Express + TypeScript + Prisma + PostgreSQL) — nur für Enterprise-Variante

Geteilte Konfiguration auf Root-Ebene:
- `tsconfig.base.json` — gemeinsame TypeScript-Basis (extended von beiden Apps)
- `eslint.config.js` — gemeinsame ESLint-Regeln (`sharedRules`-Export, von `apps/po-suite` importiert)

Die vollständige Entwickler-Dokumentation liegt hier:

→ **[apps/po-suite/CLAUDE.md](apps/po-suite/CLAUDE.md)**
→ **[ARCHITECTURE.md](ARCHITECTURE.md)** — Dual-Build-Diagramm, Backend-Struktur, Deployment

---

## Wichtigste Eckpunkte

### Branch & Deploy

| Variante | Build-Flag | Auth | Deploy |
|---|---|---|---|
| **GitHub Pages** | `VITE_TARGET=github` (Default) | Env-Var-Credentials, API-Key im Browser | GitHub Actions → gh-pages |
| **Enterprise** | `VITE_TARGET=enterprise` | Username/Password → JWT | Docker / OpenShift |

- **Aktiver Branch:** `main`
- **GitHub Pages:** `https://larsjoss.github.io/PO-Suite/`
- **Deploy-Trigger:** Push auf `main` mit Änderungen in `apps/po-suite/**` oder `workflow_dispatch`
- **Vite base:** `/PO-Suite/` für GitHub-Build, `/` für Enterprise

### Entwicklung starten

**Nur Frontend (GitHub-Variante):**
```bash
npm install                              # Root-Install (alle Workspaces)
npm run dev                              # http://localhost:5173
npm run test                             # 634 Tests, alle grün
npm run build                            # Production-Build (tsc + Vite)
# oder direkt im Workspace:
cd apps/po-suite
npm run test:run
npm run e2e                              # Playwright E2E-Tests (10 Tests)
```

**Mit Backend (Enterprise-Variante):**
```bash
docker compose up                          # db + backend
cd apps/backend && npm test               # 18 Backend-Tests
cd apps/po-suite && npm run test:enterprise  # 15 Enterprise-Pfad-Tests
```

### Konventionen (Kurzfassung)

- Modell überall: `claude-sonnet-4-5`, max_tokens je nach Tool (2048 / 4000 / 6000)
- System-Prompts zentral in `src/services/prompts/[tool].ts` (Frontend) bzw. `apps/backend/src/services/prompts.ts` (Backend)
- Neues Tool: Prompt → Service → Hook → Komponenten → Page → `App.tsx` Route (lazy) → `constants/tools.tsx` → Backend-Endpunkt in `apps/backend/src/routes/tools.ts`
- State-Machine-Pattern: `'input' | 'output'`
- API-Calls Frontend: nur via `getApiClient()` aus `src/shared/services/apiClient.ts` (GitHub-Pfad) bzw. `fetchApi()` aus `src/shared/services/httpClient.ts` (Enterprise-Pfad)
- Timeout via `withTimeout()` (GitHub) bzw. `fetchWithTimeout()` (Enterprise, 60 s AbortController)
- sessionStorage-Keys: zentral in `src/shared/services/storageKeys.ts`
- Keine direkten `sessionStorage`-Zugriffe in Komponenten
- Validierung: Submit-Button `disabled`, kein Toast/Alert
- Dark Mode: CSS-Variablen-Token-System (`src/index.css`), Theme via `ThemeContext` — keine `dark:`-Präfixe in Komponenten nötig

### Claude Code Hooks

| Hook | Auslöser | Aktion |
|---|---|---|
| `SessionStart` | Sitzungsstart | `session-start.sh` — `npm install` wenn `CLAUDE_CODE_REMOTE=true` |
| `PostToolUse` | `git commit*` | Automatischer Test-Run nach Commit |

### Slash Commands

| Command | Zweck |
|---|---|
| `/new-component` | Konventionen für neue React-Komponenten |
| `/new-service` | Konventionen für neue API-Services |

---

## Weitere Dokumentation

- [README.md](README.md) — Projektüberblick, Tech Stack, Schnellstart (Frontend + Enterprise)
- [ARCHITECTURE.md](ARCHITECTURE.md) — High-Level-Architektur, Datenfluss, Tool-Kontrakt, Roadmap
- [docs/UI_UX.md](docs/UI_UX.md) — Farbpalette, Design-Tokens, Komponenten-Bibliothek, WCAG
