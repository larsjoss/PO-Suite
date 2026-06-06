# Architecture Decision Records (ADRs)

Architecture Decision Records dokumentieren **warum** Entscheidungen so getroffen wurden — nicht nur was entschieden wurde. Ziel: In 6 Monaten ist der Entscheidungskontext noch rekonstruierbar.

Format: Kontext → Entscheidung → Evaluierte Alternativen → Konsequenzen (positiv + negativ) → Offene Punkte

---

## Index

| Nr | Titel | Status | Datum |
|---|---|---|---|
| [ADR-001](ADR-001-sessionstorage-api-key.md) | sessionStorage für API-Key-Speicherung | Akzeptiert | 2026-06-05 |
| [ADR-002](ADR-002-client-side-spa.md) | Kein Backend — reine Client-Side SPA (GitHub-Pages-Variante) | Akzeptiert | 2026-06-05 |
| [ADR-003](ADR-003-vite-build-tool.md) | Vite als Build-Tool (statt CRA / Next.js / Webpack) | Akzeptiert | 2026-06-05 |
| [ADR-004](ADR-004-vitest-statt-jest.md) | Vitest als Test-Runner (statt Jest) | Akzeptiert | 2026-06-05 |
| [ADR-005](ADR-005-npm-workspaces-monorepo.md) | npm Workspaces als Monorepo-Strategie | Akzeptiert (teilweise umgesetzt) | 2026-06-05 |
| [ADR-006](ADR-006-eslint-flat-config.md) | ESLint Flat Config (statt Legacy `.eslintrc`) | Akzeptiert | 2026-06-05 |

---

## Status-Definitionen

| Status | Bedeutung |
|---|---|
| **Akzeptiert** | Entscheidung getroffen und implementiert |
| **Akzeptiert (teilweise umgesetzt)** | Entscheidung getroffen, Implementierung noch nicht vollständig |
| **Ausstehend** | Entscheidung muss noch getroffen werden |
| **Überholt** | Wurde durch eine neuere Entscheidung ersetzt |
| **Abgelehnt** | Evaluiert aber nicht umgesetzt |

---

## Wie ein neues ADR erstellen

1. Nächste Nummer im Index wählen
2. Datei `docs/adr/ADR-00X-kurztitel.md` anlegen
3. Template aus einem bestehenden ADR kopieren
4. In dieser README-Tabelle eintragen
5. Mit dem Feature-Commit committen — ADR und Code gehören zusammen
