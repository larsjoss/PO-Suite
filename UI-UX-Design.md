# PO Suite — UI/UX Design Reference

## Farbpalette & Design-Tokens

Definiert in `apps/po-suite/tailwind.config.ts` (CSS-Variable-Referenzen) und in `src/index.css` (`:root` + `[data-theme="dark"]`). Alle Tailwind-Klassen sowie Opacity-Modifier (`bg-ink/40`) funktionieren vollständig.

### Light Mode

| Token | Hex | Tailwind-Klasse | Verwendung |
|---|---|---|---|
| `brand` | `#1C2B1E` | `bg-brand`, `text-brand`, `border-brand` | Primärfarbe, Buttons, Fokus-Ring, TopNav-Aktiv-Indikator |
| `brand-dark` | `#131E15` | `bg-brand-dark` | Hover-State auf Brand-Hintergrund |
| `brand-light` | `#E8EFE9` | `bg-brand-light` | Subtile Brand-Tönungen, Badges |
| `canvas` | `#F5F0E8` | `bg-canvas` | Seiten-Hintergrund (body) |
| `surface` | `#FAFAF8` | `bg-surface` | Karten, Panels, Input-Felder |
| `ink` | `#1C2420` | `text-ink` | Primärer Fliesstext |
| `ink-secondary` | `#5C5852` | `text-ink-secondary` | Sekundärer Text, Labels |
| `ink-tertiary` | `#6B6860` | `text-ink-tertiary` | Platzhalter, deaktivierte Zustände |
| `edge` | `#DDD8CF` | `border-edge` | Rahmen, Trennlinien |
| `edge-2` | `#EBE6DA` | `bg-edge-2` | Hover-Flächen, subtile Hintergründe |
| `error` | `#dc2626` | `text-error`, `border-error` | Fehlermeldungen, InlineError |
| `success` | `#16a34a` | `text-success` | Erfolgszustände, Kopierstatus |

### Dark Mode

Wird aktiviert, wenn `<html data-theme="dark">` gesetzt ist (via `ThemeContext`). Alle Tailwind-Klassen flippen automatisch — keine `dark:`-Präfixe in Komponenten nötig.

| Token | Dark-Hex | Rolle |
|---|---|---|
| `brand` | `#8FAF93` | Helleres Grün — auf dunklem Hintergrund lesbar |
| `brand-light` | `#1E2F20` | Icon-Hintergründe, Badges |
| `canvas` | `#131816` | Sehr dunkles Waldgrün — Seiten-Hintergrund |
| `surface` | `#1C211D` | Dunkle Karten / Panels / Inputs |
| `ink` | `#E8E3DC` | Warmes Weiss — Primärtext |
| `ink-secondary` | `#9C9790` | Gedämpftes Warmgrau |
| `edge` | `#2E3430` | Dunkle Rahmen |
| `error` | `#f87171` | Rot-400 — heller für dunklen Hintergrund |
| `success` | `#4ade80` | Grün-400 |

### Token-Architektur

```
src/index.css           → CSS Custom Properties (RGB-Kanäle)
                           :root { --color-brand: 28 43 30; }
                           [data-theme="dark"] { --color-brand: 143 175 147; }

tailwind.config.ts      → Referenzen auf CSS-Variablen
                           brand: 'rgb(var(--color-brand) / <alpha-value>)'

src/context/ThemeContext.tsx → Theme-State, localStorage-Persistenz (po-theme)
                              setzt data-theme auf <html>
```

---

## Typographie

| Rolle | Schriftart | Tailwind-Klasse |
|---|---|---|
| Überschriften / Display | Playfair Display, Georgia, serif | `font-serif` |
| Fliesstext / UI | Inter, system-ui, sans-serif | `font-sans` |

- Body-Default: `font-sans`, `text-ink`, `-webkit-font-smoothing: antialiased`
- Überschriften in Panels und Cards: `font-serif`
- Markdown-Output: gerendert via `react-markdown` + `rehype-sanitize` mit Tailwind-Prose-Klassen (`prose prose-sm`)

---

## Layout & Struktur

### Seitenrahmen (App.tsx)

```
h-screen flex flex-col overflow-hidden
├── <TopNav />         sticky, h-14
└── <Outlet />         flex-1 overflow-auto
```

### Story Generator (AppShell) — 3-Spalten Desktop

```
h-full flex
├── Sidebar            w-64, overflow-y-auto
├── Main Panel         flex-1
└── Insights Panel     w-80
```

Mobile: Tab-basierte Ansicht (role="tablist") mit Fade-Animation zwischen Panels.

### Alle anderen Tools — 2-Screen State Machine

```typescript
const [screen, setScreen] = useState<'input' | 'output'>('input');
```

Input-Screen → Submit → Output-Screen → "Neu generieren" → zurück zu Input (oder Overlay mit `window.confirm()` bei Datenverlust).

### TopNav

- Sticky, `h-12` (48 px), `bg-surface`, `border-b border-edge`
- Underline-Tabs mit Icons: `border-b-2 border-brand text-ink font-semibold` (aktiv), `text-ink-secondary hover:text-ink` (inaktiv)
- `aria-current="page"` auf aktivem Tab
- Rechte Seite: API-Status-Dot, Einstellungen-Button, **ThemeToggle** (Moon/Sun), Abmelden-Button

---

## Komponenten-Bibliothek

Alle Komponenten in `src/shared/components/`, Barrel-Export via `index.ts`.

### Button

```tsx
<Button variant="primary" | "secondary" | "outline" | "ghost" | "danger" size="sm" | "md" loading disabled />
```

| Variant | Verwendung |
|---|---|
| `primary` | Haupt-Submit-Aktion, Generieren, Kopieren — pill-förmig (`rounded-full`) |
| `secondary` | Sekundäre Aktionen — `border border-edge` |
| `outline` | Zurück-Navigation, Moduswechsel — `border border-brand` |
| `ghost` | Rein ikonische Buttons, TopNav-Aktionen |
| `danger` | Destruktive Aktionen (Löschen) — rot, pill-förmig |

- `loading`-Prop: zeigt Spinner, deaktiviert Button, `aria-busy="true"`
- Mindest-Touch-Target: `min-h-[44px]` (WCAG 2.5.5)

### TextArea

```tsx
<TextArea rows={4} autoGrow disabled placeholder="..." />
```

- `autoGrow`: Passt Höhe via `scrollHeight` automatisch an
- Styling: `bg-surface border border-edge rounded-lg focus:ring-2 focus:ring-brand`

### CopyButton

- Vollbreiter `primary`-Button am Ende eines Output-Panels
- Zeigt „Kopiert!" mit Häkchen nach erfolgreichem Clipboard-Write (auto-reset nach 2 s)

### InlineError

```tsx
<InlineError message="Fehlermeldung" />
```

- `role="alert" aria-live="assertive"`
- Erscheint unterhalb des Submit-Buttons (Input-Screen) oder unterhalb des Regenerieren-Buttons (Output-Screen)
- **Kein Toast, kein `window.alert()`** ausser Bestätigungsdialog bei Datenverlust

### LoadingSkeleton

```tsx
<LoadingSkeleton lines={6} />
```

- `role="status" aria-live="polite"`
- Animiertes Shimmer-Muster während API-Call läuft

### MarkdownOutput

```tsx
<MarkdownOutput>{markdownString}</MarkdownOutput>
```

- Intern: `react-markdown` + `rehype-sanitize`
- Tailwind Prose-Klassen: `prose prose-sm max-w-none`
- Für kurze Texte (z.B. Sprint Goals) **kein** `MarkdownOutput` verwenden — `prose`-Margins sind zu gross. Stattdessen `<p className="text-ink">`.

### PanelHeader

```tsx
<PanelHeader title="Titel" id="panel-id" action={<Button />} />
```

- `font-serif` für Titel, optional rechts ein Action-Element (z.B. CopyButton in kompakter Form)

### ScreenshotUpload

```tsx
<ScreenshotUpload files={files} onChange={setFiles} disabled={false} maxFiles={3} />
```

- Akzeptiert PNG/JPG/WebP, max. 5 MB pro Datei
- Drag & Drop + Click-to-upload
- Preview-Thumbnails mit Remove-Button

### RevealButton

- Toggle für Passwort-Felder / API-Key-Felder
- `min-h-[44px] min-w-[44px]` (Touch-Target)
- Ersetzt native Browser-Controls (`-ms-reveal` / `-ms-clear` in CSS ausgeblendet)

### SettingsDialog

```tsx
<SettingsDialog open={isOpen} onClose={handleClose} />
```

- Native `<dialog>` mit `showModal()` → automatischer Fokus-Trap, Escape-Handler
- `aria-labelledby` auf Heading; Backdrop-Klick schliesst Dialog
- Ändert `anthropic_api_key` in sessionStorage über `useAuth().setApiKey`
- Trimmt Whitespace beim Speichern, Submit auch via Enter

### Select

```tsx
<Select id="id" label="Label" value={v} onChange={setV} options={[{ value, label }]} disabled />
```

- Native `<select>` mit custom Chevron-Overlay, `appearance-none`
- Focus: `focus-visible:ring-2 focus-visible:ring-brand`

### Checkbox

```tsx
<Checkbox label="Text" checked={v} onChange={setV} indeterminate disabled />
```

- Visually hidden `<input type="checkbox">`, custom 17×17 Box
- Checked: `bg-brand border-brand` + weisses Häkchen-SVG
- Indeterminate: `bg-brand` + weisser Strich

### RadioGroup

```tsx
<RadioGroup legend="Gruppe" name="n" value={v} onChange={setV} options={[{ value, label }]} />
```

- `<fieldset role="radiogroup">`, visually hidden Inputs
- Selected: `border-brand` mit 8 px Brand-Dot

### Toggle

```tsx
<Toggle checked={v} onChange={setV} label="Beschriftung" aria-label="..." disabled />
```

- `<button role="switch" aria-checked>`, 40×23 px Track, weisser animierter Thumb
- Off: `bg-edge`, On: `bg-brand`

### SegmentedControl

```tsx
<SegmentedControl options={[{ value, label }]} value={v} onChange={setV} aria-label="..." />
```

- `role="tablist"` / `role="tab"`, `border border-edge rounded-lg overflow-hidden`
- Aktives Segment: `bg-brand text-white`

### ProgressBar

```tsx
<ProgressBar value={72} label="Upload läuft…" showPercent />
<ProgressBar />  {/* indeterminate */}
```

- 4 px Track (`bg-edge-2`), Fill (`bg-brand`), `role="progressbar"`
- Ohne `value`: animierte Indeterminate-Animation via CSS

### Snackbar

```tsx
<Snackbar variant="success" | "error" | "info" message="Text" onDismiss={fn} />
```

- `role="alert"` (error) / `role="status"` (success, info)
- success: `bg-brand-light text-green-700`, error: `bg-red-50 text-red-600`, info: `bg-edge-2 text-ink-secondary`

### Badge / Chip

```tsx
<StatusBadge variant="pass" | "fail" | "pending" | "inProgress" label="Text" />
<Chip variant="default" | "brand">KONZEPT</Chip>
```

- `StatusBadge`: Daten-Tabellen-Status mit Dot-Indikator, `rounded-full text-[10px] font-semibold`
- `Chip`: Kategorie-Label, Uppercase, Tracking `0.08em`

### Accordion

```tsx
<Accordion items={[{ id, title, content }]} />
```

- Native `<details>/<summary>`, rotierender Chevron (`accordion-chevron`)
- `border border-edge rounded-[10px] divide-y divide-edge`

### Tooltip

```tsx
<Tooltip content="Erklärung" position="top" | "bottom">
  <button>…</button>
</Tooltip>
```

- Hover + Focus getriggert, `role="tooltip"`, `bg-ink text-white text-xs rounded-md`

### ThemeToggle

```tsx
<ThemeToggle />  {/* selbst-enthaltend, liest useTheme() */}
```

- Moon-Icon (Light → Dark) / Sun-Icon (Dark → Light), in TopNav rechts integriert
- Persistiert Wahl in `localStorage` unter `po-theme`

---

## Fokus & Interaktionsmuster

### Fokus-Ring (global)

```css
:focus-visible {
  outline: 2px solid rgb(var(--color-brand));  /* passt sich Dark Mode an */
  outline-offset: 2px;
}
```

Tailwind-Äquivalent in Komponenten: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none`

**Ausnahme auf dunklem Hintergrund** (z.B. ToneSelector aktiver Button): `ring-white` statt `ring-brand`.

### Tabpanel-Animation

```css
[role="tabpanel"]:not([hidden]) {
  animation: panel-fade-in 150ms ease-out;
}

@keyframes panel-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Icons

- Format: Inline SVG, stroke-basiert (outline)
- Attribute: `fill="none"`, `stroke="currentColor"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `strokeWidth={1.5}`
- Immer `aria-hidden="true"` (dekorativ, nicht im Accessibility-Tree)
- Grösse via `className`: `w-5 h-5` (Standard), `w-10 h-10` (ToolTile)

---

## Accessibility (WCAG 2.1 AA)

| Anforderung | Umsetzung |
|---|---|
| Skip-Link (2.4.1) | `<a href="#main-content">` als erstes fokussierbares Element, `sr-only focus:not-sr-only` |
| Landmarks | `<header aria-label>`, `<main id="main-content">`, `role="region"` auf Output-Panels |
| Aktiver Tab (2.4.3) | `aria-current="page"` auf TopNav-Tab |
| Tabs / Tabpanels | `role="tablist/tab/tabpanel"`, Arrow-Key-Navigation (ArrowLeft/Right/Home/End) |
| Radiogruppe | `role="radiogroup/radio"`, Arrow-Key-Navigation |
| Fehler-Feedback | `role="alert" aria-live="assertive"` auf `InlineError` |
| Ladezustand | `role="status" aria-live="polite"` auf `LoadingSkeleton` |
| Fokus nach Generierung | `tabIndex={-1}` auf Output-Container, `useEffect` mit `ref.current.focus()` |
| Touch-Target (2.5.5) | `min-h-[44px] min-w-[44px]` auf `RevealButton` und Icon-only Buttons |
| Kontrastverhältnis | brand `#1C2B1E` auf surface `#FAFAF8` ≈ 14:1 (> 4.5:1 ✓) |

---

## ToolTile & TileStrip (Homepage)

### ToolTile

- Breite: `w-[200px]`, Mindesthöhe `h-[120px]`
- `snap-start` (für horizontales Scroll-Snapping)
- Hover: `hover:border-brand hover:shadow-sm`
- Icon: `w-10 h-10 text-brand`
- Struktur: `border border-edge rounded-xl bg-surface p-4 flex flex-col gap-2`

### TileStrip

- Horizontal scrollbar, `snap-x snap-mandatory overflow-x-auto`
- `ResizeObserver` für Arrow-Button-Sichtbarkeit (links/rechts)
- Gradient-Fade an den Rändern via `from-canvas to-transparent`
- Arrow-Buttons: `ghost`-Variante, nur sichtbar wenn Scroll-Overflow vorhanden

---

## Konventionen für neue Komponenten

1. Design-Tokens aus Tailwind verwenden — keine hardcodierten Hex-Werte in Klassen oder Inline-Styles
2. `focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none` auf alle interaktiven Elemente
3. Keine direkten `sessionStorage`-Zugriffe — nur via `getApiClient()` aus `src/shared/services/apiClient.ts`
4. State-Machine-Pattern für neue Tools: `'input' | 'output'`
5. Validierung: Submit-Button `disabled` wenn Pflichtfelder leer — kein Fehler-State, kein Toast
6. Fehler: `InlineError` unter Submit-Button (Input-Screen) bzw. unter Regenerieren-Button (Output-Screen)
7. `ConfirmDialog` statt `window.confirm()` bei Datenverlust-Risiko
8. Dark Mode: alle neuen Komponenten greifen nur auf Token-Klassen zu — kein manuelles `dark:`-Präfix nötig, da CSS-Variablen das Flipping übernehmen
