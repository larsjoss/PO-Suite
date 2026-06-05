# ADR-005: npm Workspaces als Monorepo-Strategie

**Status:** Akzeptiert (teilweise umgesetzt)  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

PO Suite hat zwei deploybare Artefakte: das React-Frontend (`apps/po-suite`) und das Express-Backend (`apps/backend`). Sie teilen keine gemeinsamen NPM-Pakete (kein `packages/`-Ordner), aber sie gehören zum selben Produkt, werden im selben Repository verwaltet, und das Backend ist technisch eine Erweiterung des Frontends (Enterprise-Variante).

Der Auslöser für die Monorepo-Entscheidung war praktisch: Bei der Einführung der Enterprise-Variante musste das Backend neben das Frontend im gleichen Repository leben. Die Alternative war ein separates Backend-Repository — was Dependency-Management, Branch-Koordination und Release-Kohärenz kompliziert hätte.

**Was umgesetzt wurde:**
- `package.json` am Root mit `"workspaces": ["apps/*"]`
- Root-Scripts delegieren via `-w apps/po-suite` bzw. `-w apps/backend`
- `tsconfig.base.json` am Root als gemeinsame TypeScript-Basis
- `eslint.config.js` am Root mit `sharedRules`-Export

**Was noch nicht umgesetzt ist:**
- Kein gemeinsames `packages/`-Paket für geteilte Typen zwischen Frontend und Backend
- Typen (`Story`, `TestPlan`, `FeatureDocInput`, etc.) sind in beiden Apps separat definiert — ohne gemeinsame Source of Truth
- Keine Task-Orchestrierung (kein Turbo, kein Nx) — Root-Scripts sind einfache `-w`-Delegationen

## Entscheidung

npm Workspaces wird als Monorepo-Strategie verwendet. Kein zusätzliches Tooling (Turbo, Nx, pnpm). Kein gemeinsames `packages/`-Paket — Typen-Sharing ist als nächster Schritt identifiziert aber noch nicht implementiert.

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **Separate Repositories** | Zwei Repos für ein Produkt: verzweigte PRs, doppelte CI-Konfiguration, manuelle Versionskoordination. Bei zwei Apps im selben Produkt nicht sinnvoll. |
| **pnpm Workspaces** | pnpm hat besseres Dependency-Hoisting und striktere Isolation. Wurde nicht gewählt weil npm Workspaces für diesen einfachen Use Case ausreicht und kein Migrations-Aufwand entsteht. |
| **Turbo / Nx** | Task-Orchestrierung (parallele Builds, inkrementelle Caches) ist wertvoll bei vielen Paketen. Mit zwei Apps und einfachen Root-Scripts ist der Overhead nicht gerechtfertigt. Revisit wenn `packages/`-Pakete hinzukommen. |
| **Lerna** | Historisch Monorepo-Standard, heute weitgehend durch Turbo/Nx ersetzt. Kein Vorteil für diesen Use Case. |

## Konsequenzen

**Positiv:**
- **Einheitliche `npm install`:** Ein Befehl am Root installiert alle Abhängigkeiten beider Apps
- **Koordinierte Scripts:** `npm run test`, `npm run build`, `npm run lint` am Root decken beide Apps ab
- **Gemeinsame Config-Basis:** `tsconfig.base.json` und `eslint.config.js` am Root vermeiden Duplikation der Compiler-Konfiguration
- **Kein Tool-Overhead:** npm Workspaces braucht kein zusätzliches Tooling — es ist in npm eingebaut
- **Zukunftssicher:** Der Wechsel zu Turbo oder pnpm ist möglich ohne Repo-Struktur zu ändern

**Negativ / Tradeoffs:**
- **Typ-Duplikation:** `Story`, `TestPlan`, `FeatureDocInput` und andere API-Typen sind in `apps/po-suite/src/types/index.ts` und `apps/backend/src/...` separat definiert. Eine Typ-Drift ist heute schon nachweisbar (`decisions`-Feld, S5-Fund in Retro). Das ist die direkte Konsequenz des fehlenden `packages/api-types`-Pakets.
- **Kein inkrementelles Caching:** Jeder `npm run build` baut alles neu. Mit zwei Apps ist das akzeptabel (Build-Zeit < 5 s). Mit mehr Paketen wird das ein Problem.
- **Root `node_modules` Hoisting:** npm Workspaces hoistet Dependencies in den Root-`node_modules`. Das kann zu impliziten Abhängigkeiten führen die in einem `pnpm`-Setup fehlschlagen würden — kein akutes Problem, aber ein potenzieller Überraschungseffekt.

**Offene Punkte:**
- **`packages/api-types`-Paket:** Das fehlende gemeinsame Typen-Paket ist die offensichtlichste Lücke. Sobald ein weiteres Feature Backend-Typen erweitert, ist die Chance hoch, dass Frontend und Backend divergieren. Die Implementierung ist S (halber Tag): neues Workspace-Paket, gemeinsame Typen rein, beide Apps importieren daraus.
- **Task-Orchestrierung:** Wenn mehr als zwei Apps hinzukommen oder Build-Abhängigkeiten (Backend muss vor Frontend typen-geprüft werden), ist Turbo zu evaluieren.
