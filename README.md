# PO Suite

KI-gestützte App für Product Owner in agilen Teams (Scrum/SAFe). Fünf Tools automatisieren die häufigsten Schreibaufgaben im PO-Alltag.

Zwei Deployment-Varianten aus derselben Codebasis: **GitHub Pages** (browser-only, kein Backend) und **Enterprise** (Express-Backend, PostgreSQL, OpenShift-fähig).

**Live:** [https://larsjoss.github.io/PO-Suite/](https://larsjoss.github.io/PO-Suite/)

---

## Tools

| Tool | Aufgabe |
|---|---|
| **Story Generator** | Anforderung → User Story mit Akzeptanzkriterien + Refinement-Hinweisen |
| **Goal Generator** | Kontext → Sprint Goal oder PI Objective mit Qualitätsbegründung + Verfeinerungsloop |
| **Test Case Generator** | User Story + Screenshots → strukturierter Testplan (Jira-Markdown-Export) |
| **Doc Generator** | Story / Feature + Screenshots → Confluence-Dokumentation |
| **Text Polisher** | Rohtext / Notizen / E-Mail → sprachlich aufbereiteter Output (E-Mail, Meeting-Protokoll, Freitext) |

---

## Tech Stack

### Frontend (beide Varianten)

| Layer | Technologie |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 (eigene Design-Tokens) |
| Routing | React Router v6 |
| Server-State | TanStack Query v5 |
| KI | @anthropic-ai/sdk, Modell `claude-sonnet-4-5` |
| Tests | Vitest + @testing-library/react (448 Unit/Integration-Tests, 42 Dateien) + Playwright (10 E2E-Tests) |

### Backend (Enterprise-Variante)

| Layer | Technologie |
|---|---|
| Server | Express.js + TypeScript |
| ORM | Prisma + PostgreSQL |
| Auth | JWT (HS256) + bcrypt |
| Validierung | Zod |
| Logging | pino |

---

## Monorepo-Struktur

```
/
├── package.json          # npm workspaces root
├── tsconfig.base.json    # geteilte TypeScript-Basis
├── eslint.config.js      # geteilte ESLint-Regeln
└── apps/
    ├── po-suite/         # React-Frontend (GitHub Pages + Enterprise)
    └── backend/          # Express-Backend (Enterprise-Variante)
```

---

## Lokales .env-Setup

Beim ersten Checkout:

```bash
cp .env.example .env.local
# .env.local öffnen und VITE_AUTH_EMAIL / VITE_AUTH_PASSWORD setzen
```

`.env.local` ist gitignored und wird nie committet. Vite liest die Datei beim Start des Dev-Servers automatisch vom Repo-Root ein.

> **Anthropic API-Key:** Der Key gehört **nicht** in `.env.local`. Er wird im Login-Formular eingegeben und nur in `sessionStorage` gehalten — nie als Build-Zeit-Variable eingebettet. Details: [`.env.example`](.env.example).

---

## Schnellstart

### GitHub-Pages-Variante (browser-only)

```bash
npm install                # Root-Install (alle Workspaces)
npm run dev                # Dev-Server auf http://localhost:5173
npm run test               # 448 Vitest-Tests
# oder direkt im Workspace:
cd apps/po-suite
npm run build              # Production-Build (VITE_TARGET=github ist Default)
npm run e2e                # Playwright Smoke-Tests (einmalig: npx playwright install chromium)
```

Vor dem ersten Login `.env.local` am Root anlegen (siehe oben). Den Anthropic API-Key (`sk-ant-…`) danach im Login-Formular eingeben.

### Enterprise-Variante (Backend + PostgreSQL)

```bash
# Alle Services starten (Backend + PostgreSQL)
docker compose up

# Benutzer anlegen
cd apps/backend
npx ts-node scripts/create-user.ts --email po@firma.ch --password sicher123
```

Backend läuft auf `http://localhost:3000`, Frontend-Dev-Server auf `http://localhost:5173` (mit `VITE_TARGET=enterprise`).

---

## Deployment

### GitHub Pages

GitHub Actions → `actions/deploy-pages` — automatisch auf Push zu `main` mit Änderungen in `apps/po-suite/**` oder manuell via `workflow_dispatch`.

### Enterprise (OpenShift / Docker)

```bash
# Images bauen und pushen (via CI)
docker build -t ghcr.io/larsjoss/po-suite-backend:latest ./apps/backend
docker build -f apps/po-suite/Dockerfile.production -t ghcr.io/larsjoss/po-suite-frontend:latest ./apps/po-suite

# OpenShift-Deploy
kubectl apply -f openshift/
```

Secrets (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `DATABASE_URL`) werden via `oc create secret generic` bereitgestellt — nie committet.

---

## Dokumentation

- [Architecture](ARCHITECTURE.md) — Dual-Build-Diagramm, Schichten, Datenfluss, Tool-Kontrakt, Roadmap
- [UI/UX Design Reference](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten, WCAG
- [Developer Guide](apps/po-suite/CLAUDE.md) — Ordnerstruktur, Konventionen, API-Details, Tests
