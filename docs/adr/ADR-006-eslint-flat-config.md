# ADR-006: ESLint Flat Config (statt Legacy `.eslintrc`)

**Status:** Akzeptiert  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

ESLint 9 hat ein neues Konfigurationsformat eingeführt: "Flat Config" (`eslint.config.js` mit `export default [...]`). Das alte Format (`.eslintrc.js`, `.eslintrc.json`) ist in ESLint 9+ als "Legacy Config" bezeichnet und wird in einer zukünftigen Hauptversion entfernt.

Das Projekt hat einen Monorepo-Aufbau mit zwei Apps (`apps/po-suite`, `apps/backend`) und einer Root-Konfiguration. Eine zentrale Konfiguration mit App-spezifischen Erweiterungen ist das Ziel.

**Konfigurationsstruktur:**
```
eslint.config.js          ← Root: sharedRules-Export, ignoriert apps/
apps/po-suite/eslint.config.js  ← importiert sharedRules, fügt React/Hooks-Plugins hinzu
```

## Entscheidung

ESLint Flat Config (v9+) wird verwendet. Gemeinsame Regeln (`sharedRules`) werden vom Root-`eslint.config.js` exportiert und in den App-Configs importiert. Kein Legacy-`.eslintrc`-Format.

**Aktive Regeln (Root `sharedRules`):**

| Regel | Level | Begründung |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | `warn` | `any` ist manchmal nötig (Mocks, Adapters) — Error wäre zu strikt |
| `@typescript-eslint/no-unused-vars` | `error` (args: `^_`) | Tote Variablen sind immer ein Bug; `_`-Präfix für bewusst ignorierte Args |
| `@typescript-eslint/explicit-function-return-type` | `off` | TypeScript inferiert Return-Types zuverlässig; explizite Types wären Rauschen |
| `@typescript-eslint/consistent-type-imports` | `error` | `import type` trennt Typ-Imports von Wert-Imports — wichtig für Tree-Shaking |
| `no-console` | `warn` (allow: warn/error) | `console.log` im Produktionscode ist ein Smell; `warn`/`error` sind legitim |
| `prefer-const` | `error` | `let` für unveränderliche Werte ist ein Fehler, nicht ein Stil |
| `no-var` | `error` | `var` hat keine Stelle im modernen TypeScript-Code |

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **Legacy `.eslintrc.js`** | Deprecated in ESLint 9, wird in ESLint 10 entfernt. Jetzt zu migrieren kostet nichts; in einem Jahr kostet es mehr. |
| **Biome (statt ESLint)** | Biome ist schneller (Rust-basiert) und kombiniert Linter + Formatter. Wurde nicht evaluiert weil ESLint-Ökosystem (insb. `eslint-plugin-react-hooks`) noch nicht vollständig in Biome verfügbar ist. Revisit in 12 Monaten wenn Plugin-Parität besser ist. |
| **Oxlint (statt ESLint)** | Gleiche Situation wie Biome — schneller aber Plugin-Ökosystem unreif. Als Ergänzung zu ESLint denkbar (Oxlint für schnelle Checks, ESLint für komplexe Regeln). |
| **Keine gemeinsame Root-Config** | Jede App hätte ihre eigene vollständige ESLint-Konfiguration. Führt zu Divergenz der Regeln — App A erlaubt `any`, App B nicht. Für ein Mono-Repo nicht wünschenswert. |

## Konsequenzen

**Positiv:**
- **Zukunftssicher:** Flat Config ist der offiziell unterstützte Weg in ESLint 9+. Keine Migration-Schuld in der nächsten ESLint-Hauptversion
- **Explizite Hierarchie:** Root-Config exportiert `sharedRules`, App-Configs importieren und erweitern. Kein verstecktes Kaskaden-Verhalten wie in `.eslintrc`-`extends`-Chains
- **Modular:** Root-Config ignoriert `apps/` explizit (`ignores: ['apps/**']`). Apps haben volle Kontrolle über ihre eigene Konfiguration ohne Root-Interference
- **ESM-nativ:** `eslint.config.js` ist ein reguläres ES-Modul — kein `require()`, kein CommonJS. Passt zum `"type": "module"` Setup des Repos

**Negativ / Tradeoffs:**
- **Breaking Changes zwischen ESLint-Versionen:** Flat Config hat sich zwischen ESLint 8 RC und ESLint 9 mehrfach geändert. Wer Tutorials aus 2022-2023 befolgt landet möglicherweise bei veraltetem Flat-Config-Syntax
- **Plugin-Kompatibilität:** Nicht alle ESLint-Plugins unterstützen Flat Config gleichermassen gut. `typescript-eslint` tut es (`tseslint.config()`); ältere Plugins brauchen manchmal `FlatCompat`-Wrapper
- **Weniger `.eslintignore`:** In Flat Config werden Ignores in der Config-Datei definiert, nicht in einer separaten Datei. Das ist konsistenter aber erfordert Umgewöhnung

**Offene Punkte:**
- `eslint-plugin-react` und `eslint-plugin-react-hooks` sind in den App-Configs (`apps/po-suite/eslint.config.js`) — nicht überprüft ob diese aktuell auf Flat Config ausgerichtet sind. Falls Warnings auftauchen bei nächstem ESLint-Upgrade: `FlatCompat` aus `@eslint/eslintrc` als Übergangs-Shim.
- Biome oder Oxlint als schnellere Pre-Commit-Checks evaluieren wenn `npm run lint` langsam wird (aktuell kein Problem).
