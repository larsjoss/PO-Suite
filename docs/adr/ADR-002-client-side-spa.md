# ADR-002: Kein Backend — reine Client-Side SPA (GitHub-Pages-Variante)

**Status:** Akzeptiert  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

PO Suite ist ein internes Produktivitäts-Tool für einen einzelnen Product Owner. Die primäre Nutzungsvariante ist die GitHub-Pages-Variante: statisches Hosting, keine Serverinfrastruktur, direkter Browser-zu-Anthropic-API-Call.

Die Entscheidung hatte drei treibende Kräfte:

1. **Deployment-Einfachheit:** GitHub Pages ist kostenlos, versioniert mit dem Code, und hat kein Ops-Overhead. Kein Server, keine Datenbank, kein Monitoring, keine Backups.
2. **Privacy:** Tool-Inputs (Story-Anforderungen, Sprintziele, Testfälle) enthalten oft Business-Kontext der nicht auf fremden Servern liegen soll. Ohne Backend landen diese Daten nur bei Anthropic (per API-Call) und im Browser des Nutzers.
3. **Entwicklungsgeschwindigkeit:** Ein Backend hätte Auth, API-Design, Datenbankschema, Migrations und Deployment-Pipeline erfordert. Der Scope war: funktionsfähiges Tool, schnell.

Die Enterprise-Variante (Express + PostgreSQL + Prisma) existiert parallel und beweist, dass das Dual-Build-Pattern funktioniert — sie ist aber bewusst opt-in, nicht der Standard.

## Entscheidung

Die primäre Auslieferungsvariante ist eine reine Client-Side SPA ohne eigenes Backend. Alle AI-Calls gehen direkt vom Browser zur Anthropic API. Persistenz erfolgt via localStorage (Stories, Testpläne, Workspaces) und sessionStorage (API-Key, Auth-State). Ein Backend existiert als optionale Enterprise-Variante mit identischem Frontend-Code.

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **Next.js mit API Routes** | Erfordert Node.js-Hosting (Vercel, Railway, o.ä.). Bringt SSR die für dieses Tool keinen Vorteil hat — keine SEO-Anforderungen, kein First-Paint-Optimierungsbedarf. Komplexere Deployment-Pipeline für marginalen Gewinn. |
| **Backend-Proxy für API-Calls** | Würde API-Key serverseitig halten — sicherer. Aber: erfordert Infrastruktur, Auth-Layer, und macht das Tool von einem laufenden Service abhängig. Für einen Single-User-Prototypen nicht gerechtfertigt. |
| **Serverless Functions (Netlify/Vercel)** | Mittlerer Weg — API-Key serverside, statisches Frontend. Wäre vertretbar. Wurde nicht gewählt wegen Vendor-Lock-in und weil GitHub Pages die natürlichste Wahl für ein GitHub-Repo ist. |
| **Vollständiges SaaS-Backend** | Out of scope: Multi-User, Subscription, Team-Features. Wäre der nächste Schritt wenn das Tool über den Single-User-Bereich wächst. |

## Konsequenzen

**Positiv:**
- Zero Ops: Kein Server, kein Monitoring, keine Backups, keine Downtime
- Deployment via `git push main` — sofort live ohne CI-Wartezeit über Deploy
- Privacy: Business-Kontext verlässt den Browser nur via Anthropic API-Call
- Kostenlos: GitHub Pages + eigener Anthropic API-Key = keine laufenden Infrastrukturkosten
- Offline-Capability für gespeicherte Inhalte (Stories, Pläne via localStorage)

**Negativ / Tradeoffs:**
- **Kein serverseitiges Logging:** Keine Nutzungsdaten, keine Fehler-Telemetrie, kein Überblick wie das Tool benutzt wird
- **Kein Team-Sharing:** Workspace-Daten liegen im Browser des Nutzers. Kollaboration ist nicht möglich — ein zweiter PO sieht keine Stories des ersten
- **Kein API-Key-Schutz:** `dangerouslyAllowBrowser: true` ist explizit für Prototypen gedacht. Der Key liegt im Browser-Memory und ist prinzipiell per DevTools extrahierbar
- **localStorage-Limit:** Browser-Storage ist auf ~5 MB limitiert. Bei intensiver Nutzung (viele Stories, grosse Testpläne) ist das ein Constraint
- **Kein Cross-Device-Sync:** Stories auf dem Laptop sind auf dem Tablet nicht sichtbar

**Offene Punkte:**
- Wenn Team-Sharing oder Cross-Device-Sync gefragt wird, ist diese Entscheidung zu revidieren. Die Enterprise-Variante ist der vorgedachte Upgrade-Pfad.
- localStorage-Quota-Handling ist implementiert (S2-Fix), aber keine Rotation-Policy. Bei langfristiger Nutzung ist ein Story-Limit (z.B. max. 100 Stories) zu evaluieren.
