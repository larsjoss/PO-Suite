# PO Suite — Claude Code Guide

## Repository-Übersicht

Mono-Repo mit zwei Apps:
- `frontend/` (React 18 + TypeScript + Vite) — wird als **GitHub Pages** Single-User-Build *und* als **Enterprise**-Build (gegen Backend) ausgeliefert
- `backend/` (Express + TypeScript + Prisma + PostgreSQL) — nur für Enterprise-Variante

Die vollständige Entwickler-Dokumentation liegt hier:

→ **[frontend/CLAUDE.md](frontend/CLAUDE.md)**
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
- **Deploy-Trigger:** Push auf `main` mit Änderungen in `frontend/**` oder `workflow_dispatch`
- **Vite base:** `/PO-Suite/` für GitHub-Build, `/` für Enterprise

### Entwicklung starten

**Nur Frontend (GitHub-Variante):**
```bash
cd frontend
npm ci
npm run dev      # http://localhost:5173
npm run test:run # 448 Tests, alle grün
npm run build    # Production-Build (tsc + Vite)
npm run e2e      # Playwright E2E-Tests (10 Tests)
```

**Mit Backend (Enterprise-Variante):**
```bash
docker compose up                          # db + backend
cd backend && npm test                     # 18 Backend-Tests
cd frontend && npm run test:enterprise     # 15 Enterprise-Pfad-Tests
```

### Konventionen (Kurzfassung)

- Modell überall: `claude-sonnet-4-5`, max_tokens je nach Tool (2048 / 4000 / 6000)
- System-Prompts zentral in `src/services/prompts.ts` (Frontend) bzw. `backend/src/services/prompts.ts` (Backend, derzeit Kopie)
- Neues Tool: Prompt → Service → Hook → Komponenten → Page → `App.tsx` Route (lazy) → `constants/tools.tsx` → Backend-Endpunkt in `backend/src/routes/tools.ts`
- State-Machine-Pattern: `'input' | 'output'`
- API-Calls Frontend: nur via `getApiClient()` aus `src/shared/services/apiClient.ts` (GitHub-Pfad) bzw. `fetchApi()` aus `src/shared/services/httpClient.ts` (Enterprise-Pfad)
- Timeout via `withTimeout()` (GitHub) bzw. `fetchWithTimeout()` (Enterprise, 60 s AbortController)
- sessionStorage-Keys: zentral in `src/shared/services/storageKeys.ts`
- Keine direkten `sessionStorage`-Zugriffe in Komponenten
- Validierung: Submit-Button `disabled`, kein Toast/Alert

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
- [UI-UX-Design.md](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten-Bibliothek, WCAG
