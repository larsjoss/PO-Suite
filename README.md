# PO Suite

KI-gestützte Browser-App für Product Owner in agilen Teams (Scrum/SAFe). Fünf Tools automatisieren die häufigsten Schreibaufgaben im PO-Alltag — kein Backend, kein Daten-Upload, der Anthropic API-Key bleibt beim User im Browser.

**Live:** [https://larsjoss.github.io/PO-Suite/](https://larsjoss.github.io/PO-Suite/)

---

## Tools

| Tool | Aufgabe |
|---|---|
| **Story Generator** | Anforderung → User Story mit Akzeptanzkriterien + Refinement-Hinweisen (localStorage-Persistenz) |
| **Goal Generator** | Kontext → Sprint Goal oder PI Objective mit Qualitätsbegründung + Verfeinerungsloop |
| **Test Case Generator** | User Story + Screenshots → strukturierter Testplan (Jira-Markdown-Export) |
| **Doc Generator** | Story / Feature + Screenshots → Confluence-Dokumentation |
| **Text Polisher** | Rohtext / Notizen / E-Mail → sprachlich aufbereiteter Output (3 Use Cases: E-Mail, Meeting-Protokoll, Freitext) |

---

## Tech Stack

| Layer | Technologie |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 (eigene Design-Tokens) |
| Routing | React Router v6 |
| Server-State | TanStack Query v5 |
| KI | @anthropic-ai/sdk, Modell `claude-sonnet-4-5` |
| Persistenz | localStorage (Stories), sessionStorage (Auth + API-Key) |
| Markdown | react-markdown + rehype-sanitize |
| Tests | Vitest + @testing-library/react (352 Unit/Integration-Tests, 33 Dateien) + Playwright (Smoke-Tests) |

---

## Schnellstart

```bash
cd frontend
npm ci
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Production-Build
npm run test:run   # Vitest einmalig ausführen
npm run e2e        # Playwright Smoke-Tests (einmalig: npx playwright install chromium)
```

Vor dem ersten Login: `.env`-Datei mit `VITE_AUTH_EMAIL` und `VITE_AUTH_PASSWORD` anlegen
(siehe [`frontend/.env.example`](frontend/.env.example)).
Den Anthropic API-Key (`sk-ant-…`) einmalig im Login-Formular oder über die TopNav-Einstellungen
hinterlegen — gehalten in `sessionStorage`, beim Tab-Schliessen verworfen.

---

## Deployment

GitHub Actions → `peaceiris/actions-gh-pages` → Branch `gh-pages`

**Trigger:** Push auf `main` mit Änderungen in `frontend/**` oder manuell via `workflow_dispatch`.

**Vite-Konfiguration:** `base: '/PO-Suite/'` in `vite.config.ts` — muss immer dem GitHub-Repo-Namen entsprechen.

**SPA-Routing:** `404.html` wird beim Deploy als Kopie von `index.html` abgelegt, damit Deep-Links korrekt auflösen.

---

## Dokumentation

- [Architecture](ARCHITECTURE.md) — High-Level-Diagramm, Schichten, Datenfluss, Tool-Kontrakt, Roadmap
- [UI/UX Design Reference](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten, WCAG
- [Developer Guide](frontend/CLAUDE.md) — Ordnerstruktur, Konventionen, API-Details, Tests
