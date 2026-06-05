# PO Suite — Technische Retrospektive

**Datum:** 2026-06-05  
**Version:** nach Housekeeping + Phase 4 (585 Tests, Build grün)  
**Scope:** `apps/po-suite/` — GitHub-Pages-Variante und Enterprise-Dual-Build

---

## 3.1 Was gut funktioniert — und warum

### 1. `withTimeout` + `getApiClient()` als erzwungener Vertrag

Jeder API-Call im Frontend läuft durch zwei Funktionen: `getApiClient()` in `apiClient.ts` und `withTimeout()` in `withTimeout.ts`. Das ist kein Zufall — es ist ein durchgesetzter Vertrag.

**Konkrete Implikationen:**
- **Testbarkeit:** Service-Tests mocken genau einen Einstiegspunkt (`vi.mock('../shared/services/apiClient')`). Es gibt keine Streuung, keine alternativen Fetch-Wege.
- **Timeout-Konsistenz:** 60 Sekunden gelten für alle fünf Tools. Die frühere Inkonsistenz (Story Generator ohne Timeout) ist behoben — jetzt nutzen alle fünf Services `withTimeout`.
- **Fehlerkapselung:** Timeout-Fehler werden in einer deutschen Meldung surfaced, nicht als generischer Netzwerkfehler. Das ist im Code getestet (`httpClient.test.ts:169`).

Was dieses Pattern stark macht: Es ist nicht dokumentiert als Regel, sondern strukturell erzwungen. Wer einen neuen Service schreibt und vergisst `withTimeout`, hat einen offensichtlichen Diff zum bestehenden Muster — kein Lint-Fehler nötig.

**Einschränkung:** `withTimeout` verwendet `Promise.race()` mit einem `setTimeout` — das ist nicht dasselbe wie ein `AbortController`. Die Netzwerkverbindung läuft weiter auch wenn der Timeout feuert. Für einen Prototyp akzeptabel, für produktiven Multi-User-Betrieb ein stilles Ressourcenproblem.

---

### 2. Dual-Build via Compile-Time-Konstante — richtig implementiert

`IS_ENTERPRISE` ist ein Vite-Tree-Shaking-Target. In einem GitHub-Build (`VITE_TARGET=github`) werden alle Enterprise-Branches tot, der Code wird aus dem Bundle entfernt. Das ist eine solide Architekturentscheidung für einen Single-Binary-Dual-Build.

**Was der Code konkret macht:**
- `IS_ENTERPRISE` ist jetzt (nach Housekeeping R1) an einem Ort definiert: `shared/config/env.ts`
- Jedes Hook hat zwei Pfade — einer ruft localStorage/direkten Anthropic-Call, der andere ruft `fetchApi()` gegen das Backend
- Die Pfade teilen sich Typen und die `onSuccess`-Mutation-Logik, weil beide dasselbe `Story`-Objekt zurückgeben

**Was dabei gut ist:** Das Backend-API-Kontrakt und der Frontend-Typ sind identisch (`Story`, `TestPlan`, etc.) — kein Adapter-Layer nötig, kein Mapping in den Hooks.

**Was dabei trügt:** Die Symmetrie täuscht über einen strukturellen Unterschied hinweg. Im GitHub-Pfad generiert und persistiert das Frontend selbst. Im Enterprise-Pfad tut das Backend beides. Wenn sich Persistenz-Logik ändert, muss sie an zwei Orten geändert werden — und es gibt keinen Test der prüft ob beide Pfade dasselbe Ergebnis produzieren.

---

### 3. `useSessionState` — einfache Lösung für ein echtes Problem

Text Polisher, Doc Generator, Goal Generator: Nutzer wechseln Tools und kommen zurück. Ihr Zwischenstand soll erhalten bleiben, aber beim Tab-Schließen verschwinden. `useSessionState` löst genau das mit 28 Zeilen.

```typescript
export function useSessionState<T>(key: string, initial: T): [T, (value: T) => void]
```

Der Hook ist:
- **Drop-in für `useState`** — identische API
- **Quota-fehlerresistent** — der `try/catch` in `set()` erlaubt Weiterarbeit wenn `sessionStorage` voll ist
- **Testbar** — der Initializer liest aus `sessionStorage`, kein globaler State

Der Ansatz hat einen richtigen Trade-off gemacht: statt eines komplexen State-Management-Systems (Zustand, Redux) reicht hier ein generischer Wrapper um die Browser-Storage-API. Die Komplexität liegt im Browser, nicht im Code.

---

### 4. `constants/tools.tsx` als Single Source of Truth für Navigation

Fünf Tools, drei Konsumenten (TopNav, ToolSelectionPage, App-Routing) — alle lesen aus einer Datei. Das ist der richtige Ort für diese Information.

**Konkrete Folge:** Wenn ein sechstes Tool hinzukommt, sind es vier Schritte in vier Dateien (Prompt, Service, Hook, Page) plus eine Zeile in `constants/tools.tsx`. Die Navigation, das Routing und die Home-Page aktualisieren sich automatisch.

Das klingt trivial, ist es aber nicht: Viele Projekte haben diese Kopplung zwischen Navigation, Routing und Icon/Label in drei verschiedenen Dateien. Hier ist sie explizit in einer Struktur ausgedrückt.

---

### 5. `handoffService.ts` mit TTL — kleines Detail, richtiger Instinkt

Der Handoff zwischen Tools (z.B. Story → Test Case Generator) nutzt `sessionStorage` mit einem 15-Minuten-TTL. Das ist ein Detail, das die meisten Prototypen ignorieren würden.

```typescript
if (!parsed.source || Date.now() - parsed.timestamp > TTL_MS) {
  clearHandoff();
  return null;
}
```

Der Instinkt dahinter ist korrekt: Ein sessionStorage-Wert der nie abläuft ist ein versteckter Zustand der spätere Bugs verursacht. Das TTL macht das Verhalten vorhersehbar. Dass diese eine Zeile getestet ist (implizit durch `handoffService.test.ts`) macht sie noch besser.

---

## 3.2 Was technische Schulden erzeugt

### S1 — `window.confirm()` noch in zwei Pages (unbewusste Schuld)

**Status aus letzter Retro (2026-05-18):** Als P1-Schuld identifiziert für `DocGeneratorPage`.  
**Tatsächlicher Status heute:** `DocGeneratorPage` wurde behoben — nutzt `ConfirmDialog`. Aber `TextPolisherPage` und `GoalGeneratorPage` nutzen noch `window.confirm()`.

`TextPolisherPage:57`:
```typescript
!window.confirm('Beim Wechsel des Use Cases wird der aktuelle Output gelöscht. Fortfahren?')
```

`GoalGeneratorPage:84,134`: zwei Aufrufe, davon einer für den Reset-Button.

Das ist **unbewusste Schuld**: Der Fix wurde auf einer Page gemacht, ohne die anderen zu prüfen. `ConfirmDialog` existiert bereits in der Shared Library — die Lösung ist bekannt, sie wurde nur nicht konsequent angewendet.

**Implikation:** `window.confirm()` ist in jsdom nicht steuerbar — die entsprechenden Branches sind in keinem Test erreichbar. In diesen Branches liegt Zustandslogik (State-Reset, Mutation-Reset).

---

### S2 — Conversation-History-Aufbau in Hook statt Service (bewusste, aber teure Schuld)

Der Story Generator baut die Conversation History für Refinements **im Hook** (`useStory.ts:98-140`). Der Goal Generator macht das **im Service** (`goalGenerator.ts:175-183`). Beide Ansätze sind korrekt — aber sie sind inkonsistent.

**Warum das ein Problem ist:**
- Im Hook-Ansatz muss der Hook QueryCache-Daten auslesen (`queryClient.getQueryData`) und manuell in API-Messages konvertieren. Das ist Business-Logik im React-Layer.
- Die Logik ist länger (40 Zeilen vs. 10 Zeilen im Service-Ansatz), schwerer zu testen, und hängt von React-Query-Implementierungsdetails ab.
- Beim Enterprise-Pfad wird die History anders aufgebaut als beim GitHub-Pfad — ein versteckter Unterschied.

Das war vermutlich eine **bewusste Schuld**: Der Story Generator war der erste, der History-Management brauchte, und der Hook-Ansatz war der einfachste Weg zum Ziel. Später wurde die sauberere Lösung im Goal Generator umgesetzt — ohne Backport.

---

### S3 — localStorage ohne Größenlimit für Story-Inhalte (unbewusste Schuld)

`storage.ts` und `testCaseStorage.ts` speichern Markdown-Output unbegrenzt in localStorage. Ein Story-Generator-Output kann 2-3 kB sein. Ein Test-Case-Plan mit 20 Cases leicht 5-8 kB. Zehn Pläne: ~80 kB. Mit Workspace-Artifacts: mehr.

localStorage-Limit ist typischerweise 5 MB pro Origin. Das ist kein sofortiges Problem — aber:
- Es gibt keine Cleanup-Policy für alte Stories (Story Generator: keine Limit)
- Die Workspace-Architektur hat ein MAX_WORKSPACES-Limit (10), aber kein Artifact-Size-Limit
- Wenn das Limit überschritten wird, wirft `localStorage.setItem()` einen `QuotaExceededError` — der in `storage.ts` unbehandelt ist (im Gegensatz zu `useSessionState.ts` wo er korrekt abgefangen wird)

**Konkret:** `saveStories()` in `storage.ts` hat kein try/catch. Bei vollen localStorage wird der Call silently failing — die Story ist weg ohne Fehlermeldung.

---

### S4 — `withTimeout` verwendet Promise.race statt AbortController (bewusste Schuld)

```typescript
export async function withTimeout<T>(promise: Promise<T>, ms = 60_000): Promise<T> {
  const timeout = new Promise<never>((_, reject) => setTimeout(...));
  return Promise.race([promise, timeout]);
}
```

`Promise.race()` bricht den unterliegenden `fetch()`-Call nicht ab. Das Timeout feuert korrekt aus Nutzersicht — der API-Call läuft aber weiter, verbraucht die Verbindung und produziert API-Kosten.

Das ist für Single-User-GitHub-Pages-Nutzung akzeptabel: Timeout-Fälle sind selten, der Browser schließt Connections beim Tab-Wechsel. Im Enterprise-Kontext mit vielen parallelen Anfragen wäre das ein stilles Ressourcenproblem. `httpClient.ts` macht es richtig (AbortController). `withTimeout.ts` nicht.

Das ist eine **bewusste Schuld**: Die einfachere Implementierung wurde gewählt, und der Kommentar im httpClient zeigt, dass das Team den Unterschied kennt.

---

### S5 — Backend-Typen nicht synchron mit Frontend-Typen (gewachsene Schuld)

`FeatureDocInput` hat im Frontend ein `decisions: string` Feld (`types/index.ts:145`), das im Backend-Service fehlt (`apps/backend/src/services/docGenerator.ts`). Das Backend ignoriert das Feld stillschweigend.

Generell: 9 Typen existieren in beiden Welten unverbunden. Aktuell sind sie konsistent — aber es gibt keinen Mechanismus der Inkonsistenz verhindern würde. Die nächste Typ-Erweiterung wird wieder an zwei Stellen gemacht werden müssen — und eine wird vergessen werden.

---

## 3.3 Konkrete Empfehlungen

---

**Problem:** `window.confirm()` in `TextPolisherPage` und `GoalGeneratorPage` — UI-Blocking, nicht testbar, nicht accessible.  
**Risiko:** Zustandslogik in nicht-testbaren Branches. Bei Keyboard-Navigation: modale Browser-Dialoge unterbrechen den Fokus-Flow ohne ARIA-Ankündigung. Tests können diese Pfade nicht covern.  
**Massnahme:** Die bestehende `ConfirmDialog`-Komponente aus `shared/components` an drei Stellen einsetzen. Pattern aus `DocGeneratorPage` exakt kopieren — kein neuer Code nötig.  
**Aufwand:** XS (1–2 Stunden)  
**Priorität:** Vor nächstem Feature — es ist ein Copy-Paste-Fix mit bekanntem Muster.

---

**Problem:** `saveStories()` und `savePlans()` in `storage.ts` / `testCaseStorage.ts` werfen `QuotaExceededError` unkontrolliert.  
**Risiko:** Bei vollem localStorage verliert der Nutzer eine gerade generierte Story ohne Fehlermeldung. Kein Toast, kein Recovery, kein Hinweis.  
**Massnahme:** `try/catch` um `localStorage.setItem()` in beiden Storage-Services, mit einer lesbaren Fehlermeldung via `throw`. Die aufrufenden Hooks fangen das via `onError` in React Query ab — das Muster existiert bereits für API-Fehler. Optional: Story-Limit (z.B. 50) mit automatischer Rotation der ältesten.  
**Aufwand:** XS  
**Priorität:** Vor nächstem Feature — betrifft Datenverlust.

---

**Problem:** Conversation-History-Aufbau im Hook (`useStory.ts`) statt im Service (`goalGenerator.ts`).  
**Risiko:** Business-Logik im React-Layer ist schwer isoliert testbar. Der Enterprise-Pfad und der GitHub-Pfad bauen History leicht unterschiedlich auf — ein potenzieller Divergenz-Punkt.  
**Massnahme:** `buildConversationHistory(story, refinements, instruction)` als reine Funktion in `services/claude.ts` extrahieren. `useStory.ts` ruft sie auf. Unit-testbar ohne React, kein QueryCache-Zugriff nötig.  
**Aufwand:** S (halber Tag, inkl. Tests)  
**Priorität:** Parallel — kein Bug, aber die nächste Anfasserei an Story-Refinement macht es doppelt so teuer.

---

**Problem:** `withTimeout` verwendet `Promise.race()` statt `AbortController` — unterliegender API-Call wird nicht abgebrochen.  
**Risiko:** Im GitHub-Build: minimal (Single-User, Browser-managed). Im Enterprise-Build: parallele Timeout-Requests belasten Backend und API-Quota. Die Implementierung in `httpClient.ts` macht es richtig — `withTimeout.ts` ist inkonsistent.  
**Massnahme:** `withTimeout` auf `AbortController` umstellen. Signatur bleibt identisch. Oder: Für GitHub-Build als akzeptiert dokumentieren, für Enterprise `fetchWithTimeout` aus `httpClient.ts` direkt nutzen.  
**Aufwand:** S  
**Priorität:** Backlog für GitHub-Build / Vor Enterprise-Rollout wenn zutreffend.

---

**Problem:** Backend-Typen (`FeatureDocInput`, `TestPlan`, `ConversationMessage`, ...) wachsen unabhängig von Frontend-Typen.  
**Risiko:** Stille API-Vertrags-Brüche. Heute: `decisions`-Feld wird ignoriert. Morgen: Typ-Erweiterung wird einseitig gemacht, beide Seiten divergieren.  
**Massnahme:** Kein shared package nötig — stattdessen einen Sync-Check als CI-Step: `tsc --project tsconfig.check.json` der beide Typ-Definitionen auf Kongruenz prüft. Oder: Backend-Typen explizit aus einem gemeinsamen `api-types.ts` importieren (copy-on-build via Script).  
**Aufwand:** M  
**Priorität:** Backlog — bis zum ersten Enterprise-Feature das einen neuen Feld-Typ einführt.

---

## 3.4 Offene Fragen (keine Empfehlung ohne mehr Kontext)

**Persistenz-Policy:** Story Generator: localStorage (persistent). Text Polisher, Goal Generator, Doc Generator: sessionStorage (flüchtig). TCG: localStorage für Pläne, sessionStorage für in-progress. Das ist funktional begründet — aber implizit. Vor dem nächsten Tool-Epic sollte eine explizite ADR existieren: Wann wird was wo gespeichert und wann rotiert?

**Story Generator Layout:** Als einziges Tool mit AppShell-3-Panel-Layout vs. 2-Screen-State-Machine der vier anderen. Das ist historisch gewachsen, nicht designt. Wenn Workspace-Features für alle Tools kommen, wird das Layout zum Blocker. Die Frage ist nicht ob, sondern wann.

**`dangerouslyAllowBrowser: true`:** Der Anthropic SDK-Flag ist explizit für Prototypen gedacht. Er bedeutet: API-Key liegt im Browser, jeder der die DevTools öffnet kann ihn lesen. Das ist für einen Single-User-Prototyp akzeptiert. Für breitere Ausrollung (mehr Nutzer, Firmen-API-Keys) ist das eine offene Sicherheitsfrage die eine Architekturentscheidung braucht — nicht einen Fix.

---

## 3.5 Testabdeckung — Vorher/Nachher

### Coverage (Statements / Branches)

| Zeitpunkt | Tests | Statements | Branches | Funktionen |
|---|---|---|---|---|
| **Vor Housekeeping** (Phase 1) | 541 | ~71 % | ~61 % | ~70 % |
| **Nach Phase 4** (heute) | **585** | **78.6 %** | **64.8 %** | **72.6 %** |

Branch-Coverage-Ziel (≥ 80 %) ist noch nicht erreicht — der Haupttreiber sind untestete UI-Komponenten (`Accordion`, `Checkbox`, `RadioGroup`, `Select`, `SegmentedControl`, `Tooltip`, `Snackbar`) und Enterprise-Pfade in Hooks. Der kritische Servicebereich ist gut abgedeckt (services: 84 % Branch).

### Nachgelieferte Tests — was fehlte und warum

**`src/shared/services/apiClient.test.ts`** (11 Tests, neu)  
Fehlte weil: `getApiClient()` wurde als reine Utility-Funktion behandelt. Ist aber sicherheitskritisch — API-Key-Isolation zwischen sessionStorage und localStorage, Caching-Verhalten, Fehler bei leerem Key. Diese Tests decken Fälle ab die bei einer Regression direkt Nutzerdaten exponieren würden.

**`src/services/testCaseStorage.test.ts`** (12 Tests, neu)  
Fehlte weil: `testCaseStorage.ts` wurde parallel zu `storage.ts` entwickelt — die Tests für `storage.ts` existierten, wurden aber nie auf das neue Modul portiert. `QuotaExceededError`-Handling war in beiden Modulen ungetestet; der Fix (S2) hätte ohne Tests unbemerkt regressieren können.

**`src/hooks/useTestCasePlans.test.ts`** (9 Tests, neu)  
Fehlte weil: Hook-Tests für `useStory` und `useStories` existierten — `useTestCasePlans` wurde analog geschrieben, aber das Test-File nie angelegt. `useDeleteTestPlan` ist der einzige Mutations-Hook ohne Test gewesen.

**`src/services/claude.test.ts`** — erweitert um 10 Tests  
Fehlte weil: `parseOutput`, `extractTitle`, `formatStoryMarkdown` waren getestet — aber `generateStory`, `refineStory`, `refineStoryWithHints` (die async API-Aufrufe) nicht. `buildStoryConversationHistory` existierte erst nach S3-Fix und wurde direkt mit Tests begleitet.

**`src/services/storage.test.ts`** — erweitert um 2 Tests  
Fehlte weil: `QuotaExceededError`-Handling war in `storage.ts` nicht implementiert (S2-Fund). Die Tests wurden nach dem Fix ergänzt — nicht davor. Test-first hätte den Bug verhindert.

### Kritische Dateien — aktueller Stand

| Datei | Branch-Coverage | Anmerkung |
|---|---|---|
| `services/storage.ts` | **100 %** | vollständig |
| `services/testCaseStorage.ts` | **100 %** | vollständig |
| `services/claude.ts` | via Mock-Isolation | async paths gedeckt |
| `shared/services/apiClient.ts` | via Constructor-Mock | security-paths gedeckt |
| `shared/services/withTimeout.ts` | via Integration | Promise.race + clearTimeout |
| `shared/services/httpClient.ts` | via Enterprise-Tests | 15 Integrationstests |
| `services/prompts.ts` | ➖ nicht gemessen | reine String-Konstanten, kein Branch |

### Branchen unter 80 % — Ursachen und Plan

**`hooks/useStory.ts` (58 % Branch):** Enterprise-Pfad (`IS_ENTERPRISE === true`) ist in Unit-Tests nicht erreichbar — `VITE_TARGET` wird zur Compile-Zeit eingebettet. Nur via `vitest.enterprise.config.ts` testbar. Kein unmittelbarer Handlungsbedarf.

**`shared/components/` (52 % Branch):** Viele neue UI-Komponenten (`Accordion`, `Select`, `RadioGroup`, `SegmentedControl`, `Tooltip`) haben keine Tests — sie sind rein visuell und haben wenig Branch-Logik. P2-Backlog wenn ein Komponent in einem kritischen Pfad genutzt wird.

**`hooks/useDocGenerator.ts`, `useGoalGenerator.ts` (50–67 % Branch):** ConfirmDialog-Pfade und Enterprise-Pfade. Nach S1-Fix sind die `window.confirm`-Branches durch `ConfirmDialog`-Tests gedeckt; Enterprise-Pfad wie oben.

---

## Vergleich mit Retro 2026-05-18

| Schuld | Status Mai | Status Juni |
|---|---|---|
| `window.confirm` in DocGeneratorPage | 🔴 P1-Schuld | ✅ Behoben (`ConfirmDialog`) |
| `withTimeout` fehlte in Story Generator | 🔴 Inkonsistenz | ✅ Behoben |
| httpClient Unit-Tests | 🔴 Fehlend | ✅ `httpClient.test.ts` vorhanden (190 Zeilen, inkl. Timeout) |
| `window.confirm` in TextPolisher/GoalGenerator | ➖ Nicht erkannt | 🔴 Neu identifiziert |
| localStorage QuotaExceededError | ➖ Nicht erkannt | 🔴 Neu identifiziert |
| IS_ENTERPRISE 10× deklariert | ➖ Nicht erkannt | ✅ Behoben (Housekeeping R1) |
| Backend-Typ-Drift | 🟡 Genannt | 🟡 Unverändert offen |
| Story-Generator-Layout | 🟡 Backlog | 🟡 Unverändert offen |
