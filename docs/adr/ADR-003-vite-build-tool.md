# ADR-003: Vite als Build-Tool (statt Create React App / Next.js / Webpack)

**Status:** Akzeptiert  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

Eine neue React-SPA braucht ein Build-System. Die Entscheidung fiel zum Zeitpunkt wo Create React App (CRA) de facto deprecated war, Vite als Standard-Empfehlung der React-Dokumentation gelistet wurde, und Next.js als de facto Standard für neue React-Projekte galt.

Das Tool hat spezifische Anforderungen:
- **Dual-Build:** Derselbe Quellcode muss als GitHub-Pages-SPA (`/PO-Suite/`-Base) und als Enterprise-App (`/`-Base) kompilierbar sein
- **Compile-Time-Tree-Shaking:** `IS_ENTERPRISE` muss zur Build-Zeit aufgelöst werden, nicht zur Laufzeit, damit der Enterprise-Code aus dem GitHub-Build vollständig entfernt wird
- **Kein SSR:** Single-User-Tool ohne SEO-Anforderungen; Server-Side-Rendering bringt keinen Wert
- **Schnelle Entwicklungsiteration:** HMR (Hot Module Replacement) für schnelles Feedback

## Entscheidung

Vite 5 mit `@vitejs/plugin-react` wird als Build-Tool verwendet. Die Konfiguration ist minimal (`vite.config.ts`: ~15 Zeilen). Compile-Time-Konstanten (`IS_ENTERPRISE`, `API_BASE`) werden via `import.meta.env` injiziert.

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **Create React App (CRA)** | Offiziell deprecated seit 2023. Kein Ejecting ohne Verlust der Tool-Unterstützung. Langsame Build-Zeiten via Webpack. Keine native `import.meta.env`-Unterstützung. |
| **Next.js** | Primär für SSR/SSG optimiert — für diesen Use Case Overhead ohne Nutzen. App Router Komplexität für ein einfaches Tool-Set unnötig. Schlechtere Tree-Shaking-Kontrolle für Compile-Time-Flags. Vercel-Deployment-Optimierungen nicht relevant für GitHub Pages. |
| **Webpack (manual setup)** | Hohe Konfigurationskomplexität. Langsamer HMR. Vite hat Webpack als Standard abgelöst für neue Projekte. |
| **Parcel** | Zero-Config-Ansatz kollidiert mit dem Dual-Build-Pattern das explizite `base`-Konfiguration braucht. Weniger ökosystem-Support als Vite. |
| **Remix** | Fokus auf Server-Side-Rendering und Form-Actions — falsches Paradigma für diesen Use Case. |

## Konsequenzen

**Positiv:**
- **Compile-Time-Tree-Shaking:** `import.meta.env.VITE_TARGET === 'enterprise'` wird zur Build-Zeit zu `false` (GitHub-Build) oder `true` (Enterprise-Build) aufgelöst. Vite eliminiert tote Branches — Enterprise-Code ist physisch nicht im GitHub-Pages-Bundle
- **HMR-Geschwindigkeit:** Native ESM-basiertes HMR ist merklich schneller als Webpack-HMR in CRA
- **Minimale Konfiguration:** `vite.config.ts` ist ~15 Zeilen. Kein Ejecting, kein CRACO, keine versteckten Webpack-Configs
- **Standard-Ökosystem:** Vite ist die offizielle React-Empfehlung (react.dev/learn). Dokumentation, Plugins und Community-Support sind erstklassig
- **Vitest-Integration:** Vitest läuft auf derselben Vite-Konfiguration — gleiche Plugins, gleiche `import.meta.env`-Auflösung, kein separates Babel-Setup für Tests

**Negativ / Tradeoffs:**
- **Kein SSR out-of-the-box:** Falls Server-Side-Rendering jemals gebraucht wird (SEO, OG-Tags), ist ein Migration zu Next.js oder ein separater SSR-Setup nötig. Für dieses Tool kein konkretes Risiko.
- **`import.meta.env` statt `process.env`:** Andere Syntax als Node.js-Standard. Kleine Lernkurve für Entwickler die primär Node-seitig arbeiten.
- **Rolldown-Migration ausstehend:** Vite 6+ migriert intern zu Rolldown (Rollup in Rust). Das ist transparent für dieses Projekt, aber eine Abhängigkeit auf ein sich bewegendes Ökosystem.

**Offene Punkte:**
- `@vitejs/plugin-react` nutzt intern SWC für JSX-Transformation (statt Babel). Ein Warning in der aktuellen Version (`esbuild` option deprecated, use `oxc`) zeigt dass das Plugin noch nicht vollständig auf den neuen Rolldown-Stack migriert ist. Bei nächstem Major-Upgrade prüfen.
