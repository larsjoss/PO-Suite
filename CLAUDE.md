# PO Suite — Claude Code Guide

## Repository-Übersicht

Mono-Repo mit einer einzigen App: `story-generator/frontend/` (React 18 + TypeScript + Vite).

Die vollständige Entwickler-Dokumentation liegt hier:

→ **[story-generator/frontend/CLAUDE.md](story-generator/frontend/CLAUDE.md)**

---

## Wichtigste Eckpunkte

### Branch & Deploy

- **Aktiver Branch:** `main`
- **GitHub Pages:** `https://larsjoss.github.io/PO-Suite/`
- **Deploy-Trigger:** Push auf `main` mit Änderungen in `story-generator/frontend/**` oder `workflow_dispatch`
- **Vite base:** `/PO-Suite/` — muss immer dem GitHub-Repo-Namen entsprechen

### Entwicklung starten

```bash
cd story-generator/frontend
npm ci
npm run dev      # http://localhost:5173
npm run test:run # 260 Tests, alle grün
npm run build    # Production-Build (tsc + Vite)
```

### Konventionen (Kurzfassung)

- Modell überall: `claude-sonnet-4-5`, max_tokens je nach Tool (2048 / 4000 / 6000)
- Neues Tool: Service → Hook → Komponenten → Page → `App.tsx` Route → `constants/tools.tsx`
- State-Machine-Pattern: `'input' | 'output'`
- API-Calls: nur via `getApiClient()` aus `src/shared/services/apiClient.ts`
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

- [README.md](README.md) — Projektüberblick, Tech Stack, Schnellstart
- [UI-UX-Design.md](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten-Bibliothek, WCAG
