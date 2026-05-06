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
| Tests | Vitest + @testing-library/react (189 Tests, 14 Dateien) |

---

## Schnellstart

```bash
cd story-generator/frontend
npm ci
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Production-Build
npm run test:run   # Tests einmalig ausführen
```

---

## Deployment

GitHub Actions → `peaceiris/actions-gh-pages` → Branch `gh-pages`

**Trigger:** Push auf `main` mit Änderungen in `story-generator/frontend/**` oder manuell via `workflow_dispatch`.

**Vite-Konfiguration:** `base: '/PO-Suite/'` in `vite.config.ts` — muss immer dem GitHub-Repo-Namen entsprechen.

**SPA-Routing:** `404.html` wird beim Deploy als Kopie von `index.html` abgelegt, damit Deep-Links korrekt auflösen.

---

## Dokumentation

- [UI/UX Design Reference](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten, WCAG
- [Developer Guide](story-generator/frontend/CLAUDE.md) — Ordnerstruktur, Konventionen, API-Details, Tests
