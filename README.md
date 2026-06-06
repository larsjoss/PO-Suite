# PO Suite

KI-gestützte Toolbox für Product Owner in agilen Teams (Scrum/SAFe). Fünf Tools automatisieren die häufigsten Schreibaufgaben im PO-Alltag — direkt im Browser, ohne Datenweitergabe an eigene Server.

**Live:** [https://larsjoss.github.io/PO-Suite/](https://larsjoss.github.io/PO-Suite/)

---

## Was ist die PO Suite?

Eine Single-Page-App die den Anthropic API-Key des Nutzers verwendet um KI-gestützte Dokumente zu generieren: User Stories, Sprint Goals, PI Objectives, Testpläne, Confluence-Dokumentationen und sprachlich aufbereitete Texte.

**Kein eigenes Backend in der Standardvariante.** Anfragen gehen direkt vom Browser zur Anthropic API. Kein Konto, keine Registrierung, keine Datenspeicherung auf fremden Servern — nur dein eigener Anthropic API-Key und der Browser.

---

## Für wen

Product Owner und Business Analysten die regelmässig Stories schreiben, Sprintziele formulieren, Testpläne erstellen und Texte für Confluence oder E-Mail aufbereiten. Optimiert für den Einzelnutzer — kein Team-Sharing in der Standardvariante.

---

## Tools

| Tool | Input → Output |
|---|---|
| **Story Generator** | Anforderung → User Story mit Akzeptanzkriterien + Refinement-Hinweisen |
| **Goal Generator** | Sprint-Kontext → Sprint Goal oder PI Objective (2–3 Varianten) + Qualitätsbegründung |
| **Test Case Generator** | User Story + Screenshots → strukturierter Testplan (Jira-Markdown-Export) |
| **Doc Generator** | Story / Feature + Screenshots → Confluence-Dokumentation |
| **Text Polisher** | Rohtext / Notizen / E-Mail → sprachlich aufbereiteter Output |

---

## Wie es funktioniert

1. Einstieg über die Live-URL oder lokalen Dev-Server
2. Login mit Zugangsdaten (aus `.env.local`)
3. Anthropic API-Key eingeben (`sk-ant-…`) — wird nur im Browser-sessionStorage gehalten, nie übertragen
4. Tool wählen, Input eingeben, Output generieren und kopieren

Der API-Key ist das einzige was du brauchst. Er ist nur für die aktuelle Browser-Session aktiv und wird beim Schliessen des Tabs gelöscht.

---

## Schnellstart (lokal)

**Voraussetzungen:** Node.js 20+, npm 10+, ein Anthropic API-Key

```bash
# 1. Repository klonen
git clone https://github.com/larsjoss/PO-Suite.git
cd PO-Suite

# 2. Dependencies installieren
npm install

# 3. Lokale Credentials anlegen
cp .env.example .env.local
# .env.local öffnen und VITE_AUTH_EMAIL / VITE_AUTH_PASSWORD setzen

# 4. Dev-Server starten
npm run dev
# → http://localhost:5173
```

Im Login-Formular zuerst Email/Passwort aus `.env.local`, dann den Anthropic API-Key eingeben.

---

## Projektstruktur

```
/
├── package.json              npm workspaces root
├── tsconfig.base.json        gemeinsame TypeScript-Konfiguration
├── eslint.config.js          gemeinsame ESLint-Regeln (Flat Config)
├── .env.example              Vorlage für lokale Credentials
├── apps/
│   ├── po-suite/             React-Frontend (GitHub Pages + Enterprise)
│   │   └── src/
│   │       ├── services/     API-Calls + localStorage (pro Tool)
│   │       ├── hooks/        React-Query-Mutations und -Queries
│   │       ├── pages/        Eine Page pro Tool
│   │       └── shared/       Wiederverwendbare Services und Komponenten
│   └── backend/              Express-Backend (Enterprise-Variante)
└── docs/
    ├── adr/                  Architecture Decision Records
    ├── RETRO.md              Technische Retrospektive
    └── UI_UX.md              Design-System-Dokumentation
```

Vollständige Entwickler-Dokumentation: [apps/po-suite/CLAUDE.md](apps/po-suite/CLAUDE.md)

---

## Tests

```bash
npm run test           # 585 Vitest-Unit/Integration-Tests
cd apps/po-suite && npm run e2e   # 10 Playwright-E2E-Tests
```

Coverage (aktuell): 78.6 % Statements, 64.8 % Branch.

---

## Deployment

### GitHub Pages (automatisch)

Push auf `main` mit Änderungen in `apps/po-suite/**` löst GitHub Actions Deploy aus. Manuell via `workflow_dispatch`. Credentials kommen aus GitHub Secrets.

### Enterprise-Variante (Docker / OpenShift)

Die App hat eine Enterprise-Variante mit Express-Backend, PostgreSQL und JWT-Auth — für Firmenumgebungen wo der API-Key nicht im Browser liegen darf.

```bash
docker compose up    # Backend + PostgreSQL lokal starten
```

Details: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Contributen

Dieses Repo hat aktuell einen Hauptentwickler. Für Änderungen:

1. Feature-Branch von `main` erstellen (`feature/kurzer-name`)
2. Änderungen mit Tests umsetzen (`npm run test` muss grün bleiben)
3. Build prüfen (`npm run build` muss fehlerfrei sein)
4. PR gegen `main` erstellen

**Vor einem neuen Feature:** [`apps/po-suite/CLAUDE.md`](apps/po-suite/CLAUDE.md) lesen — dort stehen Konventionen, Constraints und der Schritt-für-Schritt-Prozess für neue Tools.

**Architekturentscheide:** Vor grösseren strukturellen Änderungen die [ADRs](docs/adr/README.md) lesen und wenn nötig ein neues ADR erstellen.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 + CSS Custom Properties |
| Routing | React Router v6 |
| Server-State | TanStack Query v5 |
| KI-Modell | `claude-sonnet-4-5` (Anthropic) |
| Tests | Vitest 4 + @testing-library/react + Playwright |
| Backend (Enterprise) | Express.js + Prisma + PostgreSQL |
