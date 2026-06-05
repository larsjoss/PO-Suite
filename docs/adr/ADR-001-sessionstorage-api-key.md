# ADR-001: sessionStorage für API-Key-Speicherung

**Status:** Akzeptiert  
**Datum:** 2026-06-05  
**Beteiligte:** Lars Joss (Product Owner / Entwickler)

## Kontext

PO Suite ist eine Single-User-Webanwendung die direkt im Browser gegen die Anthropic API aufruft. Der Nutzer gibt seinen persönlichen Anthropic API-Key beim Login ein. Dieser Key muss für die Dauer der Sitzung verfügbar bleiben, damit jeder Tool-Aufruf authentifiziert werden kann.

Die Kernfrage ist: Wo und wie lange soll der API-Key im Browser gespeichert werden?

**Constraints:**
- Kein eigenes Backend in der GitHub-Pages-Variante (kein Server der den Key sicher verwahren könnte)
- Single-User-Anwendung — kein Sharing, kein Mehrbenutzerbetrieb
- Der Anthropic SDK erfordert `dangerouslyAllowBrowser: true` wenn er im Browser läuft
- Datenschutz: Der Key soll nicht über Tab-Grenzen oder Browser-Neustarts hinaus exponiert bleiben

## Entscheidung

Der API-Key wird in `sessionStorage` unter dem Key `anthropic_api_key` gespeichert. Er wird beim Login-Formular eingelesen und via `getApiClient()` in `shared/services/apiClient.ts` konsumiert. Kein Direktzugriff auf `sessionStorage` in Komponenten.

## Evaluierte Alternativen

| Alternative | Warum nicht gewählt |
|---|---|
| **localStorage** | Key bleibt nach Browser-Neustart, Rechner-Sperrung, oder Übergabe an andere Person erhalten. Tab-übergreifend lesbar. Für einen Anthropic API-Key (persönlich, kostenpflichtig) ist Persistenz ein Risiko, keine Hilfe. |
| **Backend-Auth mit JWT** | Erfordert ein Backend das den Key serverseitig verwahrt. In der GitHub-Pages-Variante nicht verfügbar. Im Enterprise-Build existiert diese Option — dort wird `ENTERPRISE_JWT_KEY` in sessionStorage gespeichert (kein API-Key im Browser). |
| **In-Memory (React State)** | Key geht bei Page-Reload verloren. Nutzer müsste nach jedem F5 neu einloggen. Für eine Tool-Anwendung nicht praxistauglich. |
| **Kein Key-Speicher (jedes Mal neu eingeben)** | Würde jeden API-Aufruf durch ein UI-Formular unterbrechen. Nicht nutzbar. |
| **Cookie mit HttpOnly** | Nur mit Backend sinnvoll — HttpOnly-Cookies sind für JS-Code nicht lesbar, können den SDK-Call also nicht authorisieren ohne Server-Proxy. |

## Konsequenzen

**Positiv:**
- Key wird automatisch gelöscht wenn der Tab oder Browser geschlossen wird
- Kein Risiko durch Browser-History, Export oder Sync (im Gegensatz zu localStorage)
- Isolation zwischen Tabs — kein unbeabsichtigtes Teilen
- Technisch einfach: ein `sessionStorage.getItem()` in `apiClient.ts`
- Testbar: `apiClient.test.ts` prüft explizit dass der Key **nicht** aus localStorage kommt

**Negativ / Tradeoffs:**
- Key muss bei jedem Browser-Start neu eingegeben werden — kein "Angemeldet bleiben"
- `dangerouslyAllowBrowser: true` im Anthropic SDK: Der Key ist prinzipiell per DevTools lesbar, liegt im Browser-Memory. Das ist nicht durch sessionStorage gelöst, sondern akzeptiert.
- Tab-übergreifendes Arbeiten erfordert erneutes Login (z.B. Link in neuem Tab öffnen führt zu Logout)

**Offene Punkte:**
- Für einen breiteren Rollout (Firmen-API-Keys, mehrere Nutzer) ist clientseitiger Key-Speicher keine tragfähige Lösung. Dann ist ADR-002 zu revidieren und ein Backend-Proxy-Layer zu evaluieren.
- Enterprise-Build löst das korrekt: JWT statt API-Key im Browser. Migration der GitHub-Pages-Variante in diese Richtung wenn Nutzerbasis wächst.
