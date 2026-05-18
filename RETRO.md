# PO Suite — Retro 2026-05-18

## Was gut funktioniert hat

- **Monorepo-Migration reibungslos**: npm Workspaces, ein einziges Lock-File, geteilte TS/ESLint-Basis — funktioniert genau wie entworfen. Kein App-Code war betroffen.
- **Service-Pattern ist konsistent**: Alle fünf Tools folgen demselben Schema (Prompt → Service → Hook → Page). Neues Tool anlegen folgt einem klaren, testbaren Pfad.
- **Test-Abdeckung ist stark**: 448 Unit/Integration-Tests, 42 Dateien. Kein Produktionscode ohne Test. Service-Tests mocken `getApiClient`, Page-Tests mocken den Service — saubere Schichten.
- **Prompt-Zentralisierung in `prompts.ts`**: Jeder System-Prompt ist an einem Ort, kein Prompt-Engineering verstreut im Code.
- **WCAG 2.1 AA konsequent umgesetzt**: Skip-Link, `aria-live`, Arrow-Key-Navigation, programmatischer Fokus nach Generierung — durchgehend, nicht nachträglich.
- **Code-Splitting**: 211 kB Hauptbundle trotz fünf Tools — lazy-loaded Pages funktionieren gut.
- **`constants/tools.tsx` als Single Source of Truth**: TopNav, ToolSelectionPage und Routing aus einer Datei — keine Duplikation.
- **GitHub Actions + `actions/deploy-pages@v4`**: Nach Migration vom veralteten `peaceiris`-Action ist das Deploy-Setup robust und wartungsarm.

## Was uns gebremst hat

- **Story Generator fehlte `withTimeout`**: Alle neueren Services (TCG, DocGen, GoalGen) nutzen `withTimeout`, die ersten beiden (Story, TextPolisher) nicht — Inkonsistenz, die erst im Code-Audit auffiel, kein Lint-Fehler.
- **Dual-Build-Komplexität**: `VITE_TARGET=github|enterprise` ist implizit — es gibt keine einzige Stelle, die alle bedingten Imports dokumentiert. Neue Entwickler müssen die Conditional-Logik in `App.tsx`, `httpClient.ts` und `apiClient.ts` selbst herleiten.
- **`deploy.yml` hatte verdeckte Probleme**: Der Job lief nicht auf `workflow_dispatch`, das `secrets`-Context-Limit in Step-`if`-Bedingungen war undokumentiert — beides kostet Zeit zum Debuggen.
- **ESLint v10 peer-dep-Konflikt**: `eslint-plugin-jsx-a11y` unterstützt nur ESLint ≤9. Die Downgrade-Notwendigkeit war nicht vorher absehbar und hat einen PR-Merge blockiert.
- **`window.confirm()` in DocGeneratorPage**: Synchrones Browser-Dialog für den Mode-Wechsel ist ein Anti-Pattern — blockiert, nicht cancelbar via Keyboard-Trap, untestbar in jsdom.

## Was wir anders machen würden

- **`withTimeout` von Anfang in jedem Service**: Im `/new-service`-Slash-Command explizit als Pflichtschritt aufführen — nicht als Konvention die man entdecken muss.
- **Enterprise-Dual-Build früher trennen oder dokumentieren**: Entweder ein `ENTERPRISE.md` das alle bedingten Code-Pfade erklärt, oder die Enterprise-Logik in ein eigenes Layer abstrahieren (z.B. `apiAdapter.ts` der je nach Target-Build unterschiedliche Implementierungen liefert).
- **`window.confirm()` durch Custom Modal ersetzen**: Shared `ConfirmDialog`-Komponente in die Shared-Library — testbar, accessible, konsistent.
- **Playwright-Tests ausbauen**: 10 E2E-Tests sind eine gute Basis, aber nur als Smoke-Tests. Kritische Pfade (Timeout-Handling, Mode-Wechsel, Refinement-Flow) sollten E2E-Abdeckung haben.

## Offene architektonische Fragen

- **Auth-Upgrade**: Wann ersetzt eine echte Auth-Lösung (Supabase, NextAuth) die Env-Var-Credentials? Der aktuelle Prototype skaliert nicht auf mehr als einen Benutzer.
- **Story Generator Layout**: WorkspacePage nutzt AppShell (3-Panel), alle anderen Tools nutzen das 2-Screen-State-Machine-Pattern. Sollen alle Tools vereinheitlicht werden, oder bleibt der Story Generator ein Sonderfall?
- **Persistenz-Strategie für neue Tools**: Story Generator speichert in localStorage, Text Polisher in sessionStorage, TCG gar nicht — es gibt keine explizite Policy. Bei neuen Tools muss die Entscheidung jedes Mal neu getroffen werden.
- **`prompts.ts` im Bundle**: 105 kB (28 kB gzip) als eigener Chunk — akzeptabel, aber beim nächsten Tool sollte geprüft werden ob Tool-spezifische Prompts lazy-geladen werden können.

## Technische Schulden (priorisiert)

| Priorität | Bereich | Beschreibung | Aufwand |
|---|---|---|---|
| P1 | DocGeneratorPage | `window.confirm()` durch `ConfirmDialog` aus Shared Library ersetzen | S |
| P1 | httpClient.ts | Enterprise-Path hat keine Unit-Tests (nur Integration via Enterprise-Config) | M |
| P2 | Story Generator | AppShell-Layout nicht konsistent mit 2-Screen-Pattern der anderen 4 Tools | L |
| P2 | Persistenz | Fehlende Policy für neue Tools — StorageStrategy-Abstraction oder explizite ADR | S |
| P3 | Playwright | Nur 10 Smoke-Tests — Timeout-Handling, Refinement-Flow, Mode-Wechsel fehlen | M |
| P3 | prompts.ts | Tool-spezifische Prompts könnten als eigene Chunks lazy-geladen werden | M |

## Nächste sinnvolle Features / Epics

- **Jira-Export für Stories**: Story Generator kann bereits Jira-Markdown (Vorbild TCG) — direkter API-Push wäre ein hochwertiges Enterprise-Feature.
- **Persistenz für TCG und DocGenerator**: Generierte Testpläne / Confluence-Docs gehen beim Tab-Wechsel verloren. localStorage-Persist analog Story Generator.
- **History/Versioning**: Alle Tools ausser Story Generator haben keine History. Eine leichtgewichtige "Letzte 5 Ergebnisse"-Liste pro Tool (localStorage) würde den Workflow deutlich verbessern.
- **Team-Features (Enterprise)**: Multi-User-Collaboration, geteilte Story-Bibliothek, Team-Prompt-Konfiguration — braucht die Enterprise-Variante mit PostgreSQL-Backend.
- **Prompt-Tuning-Interface**: Ein einfaches UI, das POs ermöglicht, System-Prompts pro Tool anzupassen (z.B. Firmen-Kontext hinzufügen), ohne Code-Änderung.
