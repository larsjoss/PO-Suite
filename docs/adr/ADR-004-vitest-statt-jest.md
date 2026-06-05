# ADR-004: Vitest als Test-Runner (statt Jest)

**Status:** Akzeptiert  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

Das Projekt verwendet Vite als Build-Tool. Für das Test-Framework stehen zwei dominante Optionen zur Verfügung: Jest (Marktführer, grosse Community) und Vitest (nativ auf Vite aufgebaut, seit 2022 stabil).

Die Entscheidung hatte einen klaren technischen Treiber: Das Projekt nutzt `import.meta.env` für Compile-Time-Konstanten (`IS_ENTERPRISE`, `API_BASE`). Jest läuft auf Node.js und kennt `import.meta.env` nicht — es müsste über Babel-Plugins oder separate Mocking-Schichten simuliert werden. Vitest versteht `import.meta.env` nativ, weil es auf derselben Vite-Pipeline läuft.

## Entscheidung

Vitest (aktuell v4.1.5) wird als einziger Test-Runner verwendet. Browser-Simulation via `jsdom`, Coverage via nativen V8-Provider. Auth-Credentials werden via `vitest.config.ts`-`env`-Key injiziert (kein `vi.stubEnv` nötig). Enterprise-Pfade haben eine separate `vitest.enterprise.config.ts`.

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **Jest** | Läuft auf Node.js, kennt `import.meta.env` nicht nativ. Erfordert `babel-jest` + `jest-environment-jsdom` + separate Babel-Konfiguration für TypeScript + `moduleNameMapper` für Vite-Aliases. Hoher Setup-Overhead für eine Vite-App. |
| **Jest mit `vite-jest`-Adapter** | Adapter-Ansatz fügt Komplexität ohne Mehrwert — Vitest ist der offizielle Weg und hat deutlich bessere Vite-Integration. |
| **Playwright (für alle Tests)** | Playwright ist E2E — kein Ersatz für Unit- und Integration-Tests. Im Projekt ergänzend eingesetzt (10 E2E-Tests). |
| **Testing Library ohne Runner** | Testing Library ist eine Testing-Utility, kein Test-Runner. Kommt in beiden Setups zum Einsatz (`@testing-library/react`). |

## Konsequenzen

**Positiv:**
- **Nahtlose `import.meta.env`-Unterstützung:** `IS_ENTERPRISE` wird in Tests exakt so aufgelöst wie im Build — kein Mocking, kein `__mocks__`-Ordner für Vite-Interna
- **Identische Modul-Auflösung:** Gleiche Aliases, gleiche Plugin-Konfiguration wie im Build. Tests und Build können nicht auseinanderlaufen weil sie dieselbe Pipeline nutzen
- **Kein Babel-Setup:** TypeScript-Support out-of-the-box. Kein `ts-jest`, kein `babel-jest`, kein separates `tsconfig.test.json`
- **V8-Coverage:** Native V8-Instrumentierung ohne Babel-Plugin-Overhead — Coverage-Reports sind schneller und präziser
- **`globals: true`:** Jest-kompatible globale API (`describe`, `it`, `expect`, `vi`). Keine Imports nötig — niedrige Einstiegshürde, gute DX
- **Enterprise-Split:** `vitest.enterprise.config.ts` erlaubt separate Test-Suiten mit anderem `VITE_TARGET` ohne doppelten Setup

**Negativ / Tradeoffs:**
- **Kleinere Community als Jest:** Weniger StackOverflow-Antworten, weniger Plugin-Ökosystem. Für Standard-Use-Cases kein Problem; für exotische Anforderungen möglicherweise schlechter dokumentiert
- **Vitest-spezifische APIs:** `vi.mock()` statt `jest.mock()`, `vi.fn()` statt `jest.fn()`. Wer von Jest kommt braucht minimal Umgewöhnung (API ist aber fast identisch)
- **Vite-Abhängigkeit:** Wer jemals von Vite wegmigriert (z.B. zu Next.js mit Turbopack) muss auch die Test-Infrastruktur migrieren. Das ist ein Kopplung die bewusst eingegangen wurde.

**Offene Punkte:**
- Coverage-Ziel ≥ 80 % Branch ist noch nicht erreicht (aktuell: 64.8 %). Haupttreiber sind untestete UI-Komponenten und unvermeidbare Enterprise-Pfade. Kein Vitest-Problem — ein Ressourcenproblem.
- `jsdom` simuliert keinen echten Browser — Clipboard-API, ResizeObserver und andere Browser-APIs müssen gemockt werden. Aktueller Workaround: `Object.defineProperty(navigator, 'clipboard', ...)`. Für komplexere Interaktionstests ist Playwright der richtige Layer.
