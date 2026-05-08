# PO Suite — UI/UX Design Reference

## Farbpalette & Design-Tokens

Definiert in `frontend/tailwind.config.ts` und als Tailwind-Klassen verwendbar.

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

### Wichtige Einschränkung: `canvas`

`canvas` ist ein plain Hex-String (kein Tailwind-Farbobjekt mit Opacity-Channel). **Opacity-Modifier funktionieren nicht:**

```
from-canvas/80  ✗  funktioniert nicht
from-canvas to-transparent  ✓  korrekt
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

- Sticky, `h-14`, `bg-surface`, `border-b border-edge`
- Underline-Tabs mit Icons: `border-b-2 border-brand text-brand` (aktiv), `text-ink-secondary hover:text-ink` (inaktiv)
- `aria-current="page"` auf aktivem Tab
- Kontext-Label (Name des aktiven Tools) auf grossen Viewports sichtbar

---

## Komponenten-Bibliothek

Alle Komponenten in `src/shared/components/`, Barrel-Export via `index.ts`.

### Button

```tsx
<Button variant="primary" | "secondary" | "outline" | "ghost" size="sm" | "md" loading disabled />
```

| Variant | Verwendung |
|---|---|
| `primary` | Haupt-Submit-Aktion, Generieren, Kopieren |
| `secondary` | Sekundäre Aktionen |
| `outline` | Zurück-Navigation, Moduswechsel |
| `ghost` | Rein ikonische Buttons, TopNav-Aktionen |

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

---

## Fokus & Interaktionsmuster

### Fokus-Ring (global)

```css
:focus-visible {
  outline: 2px solid #1C2B1E;  /* brand */
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

1. Design-Tokens aus Tailwind verwenden — keine hardcodierten Hex-Werte in Klassen
2. `focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none` auf alle interaktiven Elemente
3. Keine direkten `sessionStorage`-Zugriffe — nur via `getApiClient()` aus `src/shared/services/apiClient.ts`
4. State-Machine-Pattern für neue Tools: `'input' | 'output'`
5. Validierung: Submit-Button `disabled` wenn Pflichtfelder leer — kein Fehler-State, kein Toast
6. Fehler: `InlineError` unter Submit-Button (Input-Screen) bzw. unter Regenerieren-Button (Output-Screen)
7. `window.confirm()` nur bei Screen-Wechsel mit echtem Datenverlust-Risiko
