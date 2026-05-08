Führe ein UI/UX-Review einer oder mehrerer Komponenten durch — bezogen auf die Design-Konventionen, WCAG 2.1 AA und Architekturregeln des PO Suite Projekts.

Argumente: $ARGUMENTS
(Erwartet: Dateipfad(e) oder Komponentenname — z.B. "src/pages/DocGeneratorPage.tsx" oder "DocGeneratorPage" oder "src/components/doc-generator/". Kein Argument = Review der zuletzt geänderten Dateien via `git diff --name-only HEAD`.)

---

## Vorbereitung

1. Falls kein Argument: führe `git diff --name-only HEAD` aus und filtere auf `.tsx`/`.ts`-Dateien in `src/`.
2. Lies jede Zieldatei vollständig.
3. Lies ergänzend `UI-UX-Design.md` und `frontend/CLAUDE.md` falls du Details zu einem Token oder einer Konvention nachschlagen musst.

---

## Prüfkatalog

Gehe jede Kategorie durch und notiere Befunde mit Zeilennummer.

### 1 — Design Tokens

- Keine hardcodierten Hex-Werte in `className` oder `style` (`#1C2B1E`, `#F5F0E8` etc.) — ausschliesslich Tailwind-Token-Klassen (`bg-brand`, `text-ink`, `border-edge` …)
- Opacity-Modifier auf `canvas` funktionieren nicht (`from-canvas/80` ✗) → `from-canvas to-transparent` verwenden
- Hover-States auf Brand-Hintergrund: `hover:bg-brand-dark`, nicht `hover:bg-brand/90`
- Fokus-Ring auf dunklem Hintergrund: `focus-visible:ring-white`, nicht `focus-visible:ring-brand`

### 2 — Typographie

- Überschriften / Panel-Titel: `font-serif` (Playfair Display)
- Fliesstext und Labels: `font-sans text-ink`
- Kurze Ausgabetexte (Sprint Goals, einzelne Sätze): kein `<MarkdownOutput>` — prose-Margins zu gross → `<p className="text-ink">`
- Markdown-Ausgaben: `<MarkdownOutput>` mit `prose prose-sm max-w-none`

### 3 — Accessibility (WCAG 2.1 AA)

- `aria-live` niemals direkt auf `<button>` — immer auf einem inneren `<span>`
- Fokus-Ring: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none` — nie `focus:ring-2`
- Dekorative SVGs: `aria-hidden="true"` (kein `alt`, kein `title`)
- Touch-Targets: interaktive Elemente ohne sichtbares Label brauchen `min-h-[44px] min-w-[44px]` (WCAG 2.5.5)
- Programmatischer Fokus nach API-Antwort: `tabIndex={-1}` auf Output-Container + `useEffect(() => { ref.current?.focus() }, [trigger])`
- Fehler-Feedback: `<InlineError>` mit `role="alert" aria-live="assertive"` — kein `window.alert()`, kein Toast
- Ladezustand: `<LoadingSkeleton>` mit `role="status" aria-live="polite"` — kein custom Spinner ohne ARIA
- Tabs: `role="tablist/tab/tabpanel"`, Arrow-Key-Navigation (ArrowLeft/Right/Home/End)
- Radiogruppen: `role="radiogroup/radio"`, Arrow-Key-Navigation
- Output-Panels: `role="region"` mit `aria-label`
- Skip-Link in App.tsx vorhanden: `<a href="#main-content">`

### 4 — Imports & Architektur

- Shared-Komponenten nur via Barrel: `import { Button, TextArea } from '@/shared/components'` — kein direkter Pfad-Import
- API-Zugriff ausschliesslich via `getApiClient()` aus `shared/services/apiClient` — kein direkter `sessionStorage`-Zugriff in Komponenten
- Storage-Keys: nur aus `shared/services/storageKeys` — kein Hardcoding von Strings wie `'anthropic_api_key'`
- Typen aus `src/types/index.ts` importieren — kein Re-Export über Services oder Hooks
- Keine `import type`-Verletzungen: Typ-only-Imports brauchen `import type`

### 5 — Komponenten-Konventionen

- Props-Interface direkt über der Komponente (kein `FC<Props>` mit separatem Interface am Datei-Ende)
- Keine `any`-Typen
- State-Machine für Tool-Pages: `useState<'input' | 'output'>('input')` — kein Boolean-Toggle
- Submit-Button `disabled` wenn Pflichtfelder leer — kein Fehler-State, kein Toast bei leerem Submit
- `window.confirm()` nur bei Screen-Wechsel mit echtem Datenverlust-Risiko — nicht für einfache Bestätigungen
- Lazy-Loading: neue Pages via `React.lazy()` + `Suspense` in `App.tsx`

### 6 — Icons

- Format: Inline SVG, stroke-basiert, `fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}`
- Immer `aria-hidden="true"`
- Grösse via `className`: `w-5 h-5` (Standard), `w-10 h-10` (ToolTile)
- Kein Icon-Font, keine externen Icon-Libraries ausser bereits genutzten

---

## Output-Format

Gib das Ergebnis strukturiert aus:

```
## UI/UX Review — <Dateiname(n)>

### Zusammenfassung
<1–2 Sätze: Gesamteindruck>

### Befunde

#### ❌ Kritisch (muss behoben werden)
| # | Datei:Zeile | Kategorie | Problem | Empfehlung |
|---|---|---|---|---|

#### ⚠️  Verbesserungswürdig
| # | Datei:Zeile | Kategorie | Problem | Empfehlung |
|---|---|---|---|---|

#### ✅ Korrekt umgesetzt
<Bullet-Liste der überprüften Punkte ohne Befund>

### Nächste Schritte
<Priorisierte Aufgabenliste, direkt umsetzbar>
```

Wenn keine Befunde: kurze Bestätigung ohne leere Tabellen.
Wenn du Befunde beheben sollst, frage zuerst — reviewe standardmässig nur.
