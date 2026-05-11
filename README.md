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

## Schnellstart

### GitHub-Pages-Variante (browser-only)

```bash
cd frontend
npm ci
npm run dev        # Dev-Server auf http://localhost:5173
npm run build      # Production-Build (VITE_TARGET=github ist Default)
npm run test:run   # 448 Vitest-Tests
npm run e2e        # Playwright Smoke-Tests (einmalig: npx playwright install chromium)
```

Vor dem ersten Login: `.env`-Datei mit `VITE_AUTH_EMAIL` und `VITE_AUTH_PASSWORD` anlegen
(siehe [`frontend/.env.example`](frontend/.env.example)). Den Anthropic API-Key (`sk-ant-…`) im Login-Formular hinterlegen.

### Enterprise-Variante (Backend + PostgreSQL)

```bash
# Alle Services starten (Backend + PostgreSQL)
docker compose up

# Benutzer anlegen
cd backend
npx ts-node scripts/create-user.ts --email po@firma.ch --password sicher123
```

Backend läuft auf `http://localhost:3000`, Frontend-Dev-Server auf `http://localhost:5173` (mit `VITE_TARGET=enterprise`).

---

## Deployment

### GitHub Pages

GitHub Actions → `peaceiris/actions-gh-pages` → Branch `gh-pages`

**Trigger:** Push auf `main` mit Änderungen in `frontend/**` oder manuell via `workflow_dispatch`.

### Enterprise (OpenShift / Docker)

```bash
# Images bauen und pushen (via CI)
docker build -t ghcr.io/larsjoss/po-suite-backend:latest ./backend
docker build -f frontend/Dockerfile.production -t ghcr.io/larsjoss/po-suite-frontend:latest ./frontend

# OpenShift-Deploy
kubectl apply -f openshift/
```

Secrets (`ANTHROPIC_API_KEY`, `JWT_SECRET`, `DATABASE_URL`) werden via `oc create secret generic` bereitgestellt — nie committet.

---

## Dokumentation

- [Architecture](ARCHITECTURE.md) — Dual-Build-Diagramm, Schichten, Datenfluss, Tool-Kontrakt, Roadmap
- [UI/UX Design Reference](UI-UX-Design.md) — Farbpalette, Design-Tokens, Komponenten, WCAG
- [Developer Guide](frontend/CLAUDE.md) — Ordnerstruktur, Konventionen, API-Details, Tests
