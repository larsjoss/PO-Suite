# PO Suite — UI/UX Design Reference

Dieses Dokument beschreibt das Design-System, die Komponenten-Bibliothek, Tool-spezifische UX-Entscheide und den Accessibility-Status der PO Suite.

---

## 1. Design-Grundlagen

### 1.1 Farbpalette (CSS Custom Properties)

Alle Farben sind als RGB-Kanal-Variablen in `src/index.css` definiert. Das erlaubt Opacity-Modifier (`bg-brand/40`) ohne separate RGBA-Werte.

**Verwendung in Tailwind:** `bg-brand`, `text-ink`, `border-edge` — die Tokens sind in `tailwind.config.ts` als `rgb(var(--color-X) / <alpha-value>)` registriert.

#### Light Mode (`:root`)

| Token | Hex | CSS Variable | Verwendung |
|---|---|---|---|
| `brand` | `#1C2B1E` | `--color-brand` | Primärfarbe, Buttons, aktive Elemente |
| `brand-dark` | `#131E15` | `--color-brand-dark` | Hover-State von brand |
| `brand-light` | `#E8EFE9` | `--color-brand-light` | Outline-Button Hover-BG, aktive Tab-BG |
| `canvas` | `#F5F0E8` | `--color-canvas` | Seiten-Hintergrund |
| `surface` | `#FAFAF8` | `--color-surface` | Karten, Panels, Dialoge |
| `ink` | `#1C2420` | `--color-ink` | Primärtext |
| `ink-secondary` | `#5C5852` | `--color-ink-secondary` | Labels, sekundärer Text |
| `ink-tertiary` | `#6B6860` | `--color-ink-tertiary` | Platzhalter, Ghost-Buttons |
| `edge` | `#DDD8CF` | `--color-edge` | Borders |
| `edge-2` | `#EBE6DA` | `--color-edge-2` | Hover-BG, Trennlinien |
| `error` | `#dc2626` | `--color-error` | Fehlermeldungen, Danger-Buttons |
| `success` | `#16a34a` | `--color-success` | Erfolgsstatus |

#### Dark Mode (`[data-theme="dark"]`)

| Token | Hex | Bemerkung |
|---|---|---|
| `brand` | `#8FAF93` | Heller Grünton für Lesbarkeit auf dunklem BG |
| `canvas` | `#131816` | Fast-Schwarz, kein reines Schwarz |
| `surface` | `#1C211D` | Leicht aufgehellt gegenüber canvas |
| `ink` | `#E8E3DC` | Warm-weiss für Lesbarkeit |
| `error` | `#f87171` | Heller Rot-Ton für dark BG |
| `success` | `#4ade80` | Heller Grün-Ton für dark BG |

Dark Mode wird via `ThemeContext` gesteuert. Klasse `[data-theme="dark"]` sitzt auf `<html>`. **Keine `dark:`-Tailwind-Präfixe in Komponenten** — nur CSS-Custom-Properties.

---

### 1.2 Typografie

| Schrift | CSS | Verwendung |
|---|---|---|
| **Playfair Display** | `font-serif` | Überschriften (h1, h2, Dialog-Titel, Tool-Namen) |
| **Inter** | `font-sans` (body default) | Alles andere |

Beide Schriften via Google Fonts geladen. System-Fallbacks: `system-ui, sans-serif`.

**Grössen-Konventionen (Tailwind-Klassen):**
- Seitentitel: `text-2xl font-semibold font-serif`
- Abschnittstitel: `text-lg font-semibold font-serif`
- Body: `text-sm` (14px)
- Label: `text-[12px] font-medium`
- Hint/Tertiar: `text-xs`

---

### 1.3 Spacing-System

Tailwind-Standard (4px Base). Interne Konsistenz:
- Zwischen Label und Input: `gap-1` (4px)
- Zwischen Form-Elementen: `gap-4` (16px)
- Panel-Padding: `p-6` (24px)
- Dialog-Padding: `p-6` (24px)

---

### 1.4 Border-Radius & Shadows

| Element | Klasse | Wert |
|---|---|---|
| Buttons (primary/danger) | `rounded-full` | 9999px |
| Buttons (secondary/outline) | `rounded-lg` | 8px |
| Inputs, Selects, Cards | `rounded-lg` | 8px |
| Dialoge, Panels | `rounded-xl` | 12px |
| Dialog-Schatten | `shadow-xl` | Tailwind xl |

---

### 1.5 Fokus-Ring

Globaler Fokus-Ring in `src/index.css`:
```css
:focus-visible {
  outline: 2px solid rgb(var(--color-brand));
  outline-offset: 2px;
}
```
Kontrast brand auf surface ≈ 14:1 — WCAG 2.4.7 (Focus Visible, AA) und 2.4.11 (Focus Appearance, AA) erfüllt.

---

### 1.6 Animationen

| Animation | CSS-Klasse | Verwendung |
|---|---|---|
| Tab-Panel Fade-In | `panel-fade-in` (150ms ease-out) | Beim Aktivieren eines Tabs |
| Skeleton Shimmer | `.skeleton-shimmer` | LoadingSkeleton während API-Call |
| Progress Indeterminate | `.progress-indeterminate` | ProgressBar ohne Wert |
| Accordion Chevron | `.accordion-chevron` | Pfeil-Rotation bei open/close |
| Theme-Transition | `transition: background-color 0.2s` | Sanfter Dark/Light-Wechsel |

---

## 2. Komponenten-Übersicht

### Interaktive Primär-Komponenten

---

#### `Button`

**Zweck:** Primäre Interaktionsfläche. Alle Klick-Aktionen.

**Props:**
| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visueller Stil |
| `size` | `'sm' \| 'md'` | `'md'` | Grösse |
| `loading` | `boolean` | — | Zeigt Spinner, setzt `aria-busy` |
| `disabled` | `boolean` | — | Deaktiviert, 40% Opacity |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML-Button-Typ |

**Wann:** Für alle Nutzer-Aktionen. `primary` für Haupt-CTA, `secondary` für Neben-Aktionen, `danger` für destruktive Aktionen (immer in Verbindung mit `ConfirmDialog`), `ghost` für Icon-Buttons.

**Nicht:** Kein `window.confirm()` nach `danger`-Buttons — immer `ConfirmDialog` verwenden.

---

#### `TextArea`

**Zweck:** Mehrzeiliges Texteingabefeld. Haupt-Input-Element aller Tools.

**Props:**
| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `id` | `string` | — | Pflicht, für `<label>` |
| `label` | `string` | — | Sichtbares Label |
| `hideLabel` | `boolean` | `false` | Label als `sr-only` |
| `autoGrow` | `boolean` | — | Wächst mit Inhalt mit |
| `rows` | `number` | — | Basis-Höhe |

**Wann:** Für alle längeren Texteingaben. `autoGrow` für Felder wo der Nutzer viel tippen wird.

---

#### `Select`

**Zweck:** Dropdown-Auswahl aus vordefinierten Optionen.

**Props:**
| Prop | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Pflicht, für `<label>` |
| `options` | `{ value: string; label: string }[]` | Auswahloptionen |
| `hideLabel` | `boolean` | Label als `sr-only` |

**Wann:** Wenn es 3–7 Optionen gibt und alle vorher bekannt sind. Für 2 Optionen: `Toggle`. Für > 7: evtl. Autocomplete (nicht vorhanden).

---

#### `Toggle`

**Zweck:** Boolean-Schalter (an/aus).

**Props:**
| Prop | Typ | Beschreibung |
|---|---|---|
| `checked` | `boolean` | Aktueller State |
| `onChange` | `(checked: boolean) => void` | Handler |
| `label` | `string` | Sichtbares Label |
| `aria-label` | `string` | Pflicht wenn kein `label` |

**Wann:** Dark-Mode-Toggle, Feature-Flags, Boolean-Settings.

---

#### `Checkbox`

**Zweck:** Mehrselektion oder einzelne Boolean-Option in einem Formular-Kontext.

**Wann:** Wenn mehrere Optionen gleichzeitig wählbar sind. Für einzelnes Boolean in einer isolierten Einstellung: `Toggle`.

---

#### `RadioGroup`

**Zweck:** Einzelselektion aus einer Gruppe von Optionen.

**Wann:** Wenn genau eine Option aus 3–5 Optionen gewählt werden muss. Weniger als 3: `Toggle`. Mehr als 5: `Select`.

---

#### `SegmentedControl`

**Zweck:** Tab-ähnliche Selektion für 2–4 gleichwertige Optionen.

**Wann:** Für Ansichtswechsel innerhalb desselben Kontexts (z.B. Sprint Goal / PI Objective). Unterschied zu Tabs: `SegmentedControl` wechselt Inhalt inline, Tabs wechseln Panel-Sektionen.

---

### Feedback-Komponenten

---

#### `InlineError`

**Zweck:** Fehlermeldung direkt im Kontext des auslösenden Elements. Verwendet `role="alert"` + `aria-live="assertive"` — WCAG 4.1.3.

**Props:** `message: string`, `className?: string`

**Wann:** Für alle API-Fehler und Validierungsfehler. **Nicht:** Toast/Snackbar für Fehler — `InlineError` bleibt sichtbar bis der Nutzer eine Aktion macht.

---

#### `LoadingSkeleton`

**Zweck:** Platzhalter-Animation während Ladezustand. Verwendet `role="status"` für Screen-Reader.

**Wann:** Während API-Calls — zeigt wo Content erscheinen wird. Nicht für Micro-Interaktionen (< 200ms).

---

#### `ProgressBar`

**Zweck:** Fortschrittsanzeige. Ohne `value`-Prop: indeterminate Animation.

**Props:**
| Prop | Typ | Beschreibung |
|---|---|---|
| `value` | `number \| undefined` | 0–100. Kein Wert = indeterminate |
| `label` | `string` | Beschriftung |
| `showPercent` | `boolean` | Prozentzahl anzeigen |

---

#### `Snackbar`

**Zweck:** Temporäre Systembenachrichtigung (Erfolg, Fehler, Info).

**Props:** `variant: 'success' \| 'error' \| 'info'`, `message: string`, `onDismiss?: () => void`

**Wann:** Für transiente Bestätigungen (z.B. "Kopiert"). **Nicht** für Fehler die eine Nutzeraktion erfordern — dafür `InlineError`.

**Limitierung:** Kein Auto-Dismiss Timer eingebaut — Caller ist verantwortlich für Dismissal.

---

#### `ConfirmDialog`

**Zweck:** Blockierender Bestätigungs-Dialog vor destruktiven Aktionen.

**Props:**
| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `open` | `boolean` | — | Sichtbar/unsichtbar |
| `title` | `string` | — | Dialog-Überschrift |
| `message` | `string` | — | Erklärungstext |
| `confirmLabel` | `string` | `'Bestätigen'` | Bestätigungs-Button |
| `cancelLabel` | `string` | `'Abbrechen'` | Abbrechen-Button |
| `onConfirm` | `() => void` | — | Callback bei Bestätigung |
| `onCancel` | `() => void` | — | Callback bei Abbruch |

**Wann:** Immer wenn `danger`-Button gedrückt wird oder eine irreversible Aktion folgt (Modus-Wechsel mit Datenverlust, Löschen).

**Accessibility:** `role="alertdialog"` (nicht `"dialog"`), Fokus geht automatisch auf Cancel-Button, Escape schliesst, Klick auf Backdrop schliesst.

**Test-Pattern:** `screen.getByRole('alertdialog')` — nicht `'dialog'`.

**Nicht:** Kein `window.confirm()`. Kein `window.alert()`.

---

### Layout-Komponenten

---

#### `PanelHeader`

**Zweck:** Konsistente Kopfzeile für Panels (Titel + optionale Aktions-Buttons rechts).

---

#### `Accordion`

**Zweck:** Aufklappbare Inhaltssektionen via `<details>`/`<summary>`.

**Props:** `items: { id: string; title: string; content: ReactNode }[]`

**Wann:** Für optionale Detailinformationen die nicht immer gebraucht werden (z.B. Refinement-Hinweise, Coaching-Tipps).

---

#### `Tooltip`

**Zweck:** Erklärungstext der bei Hover/Focus erscheint.

**Wann:** Für Icon-Buttons oder abgekürzte Labels die eine Erklärung brauchen.

**Limitierung:** Nicht für Mobile nutzbar (kein Hover). Nie als einzige Informationsquelle — Tooltip ergänzt, ersetzt nicht.

---

#### `CoachPanel`

**Zweck:** Einblendbare Coaching-Hinweise für ein Tool. Dismissed-State wird in `sessionStorage` (`COACH_DISMISSED_KEY`) gehalten.

---

#### `HandoffBanner`

**Zweck:** Banner der erscheint wenn Inhalte via `handoffService` von einem Tool zu einem anderen übergeben wurden. TTL: 15 Minuten.

---

### Hilfsmittel-Komponenten

---

#### `CopyButton`

**Zweck:** Kopiert Text in die Zwischenablage. Gibt visuelles Feedback (Checkmark für 2 s).

---

#### `RevealButton`

**Zweck:** Zeigt/versteckt einen Wert (typischerweise API-Key). Toggle zwischen `text` und `password`.

---

#### `MarkdownOutput`

**Zweck:** Rendert Markdown-Text als HTML. Verwendet `react-markdown`.

**Wann:** Für alle AI-generierten Outputs.

---

#### `ScreenshotUpload`

**Zweck:** Drag-and-Drop und Click-to-Upload für Bilder. Konvertiert zu Base64 für Anthropic API.

**Props:**
| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `files` | `UploadedFile[]` | — | Aktuelle Dateien |
| `onChange` | `(files: UploadedFile[]) => void` | — | Update-Handler |
| `maxFiles` | `number` | `3` | Maximum Anzahl Dateien |

**Limitierung:** Nur PNG, JPEG, WebP. Max. 3 Dateien (Anthropic API-Limit pro Nachricht). Kein serverseitiger Upload — alles im Browser.

---

#### `SettingsDialog`

**Zweck:** Modal für API-Key und Team-Kontext-Einstellungen.

**Enthält:** API-Key-Feld (masked), Team-Kontext-Textarea, Dark-Mode-Toggle, Coaching-Reset.

---

#### `Badge` / `Chip`

**Zweck:** Status-Label oder Tags. `Badge` für Stati (success/warning/error/info), `Chip` für Kategorien.

---

#### `ThemeToggle`

**Zweck:** Dark/Light-Mode-Toggle im TopNav. Liest/schreibt via `ThemeContext`.

---

## 3. Tool-spezifische UX-Entscheide

### Story Generator — AppShell (3-Panel-Layout)

**Entscheid:** Einziger Tool mit persistenter 3-Panel-AppShell (Sidebar + Main + Coach) statt 2-Screen-State-Machine.

**Warum:** Story Generator war das erste Tool und das Layout entstand organisch. Stories werden häufig revisited und verglichen — eine Sidebar-Liste macht das einfacher als immer zurück-navigieren. Refinement-Loop benötigt sichtbare History.

**Schuld:** Historisch gewachsen, nicht designt. Wenn alle Tools eine History-Sidebar bekommen (wie TCG), sollte die AppShell unified werden.

**UX-Entscheid Refinement-Hints:** Refinement-Hinweise sind im Output sichtbar aber kollabiert (Accordion). Der Nutzer soll zuerst die Story lesen, dann entscheiden ob er die Hinweise braucht.

---

### Goal Generator — Varianten-Output

**Entscheid:** 2–3 Varianten gleichzeitig generiert statt einer.

**Warum:** Sprint Goals sind schwer zu bewerten ohne Alternative. 3 Varianten geben dem PO die Möglichkeit zu kombinieren oder eine als Basis zu nehmen. Das ist näher am realen PO-Workflow (brainstormen, dann entscheiden) als ein Single-Output.

**UX-Entscheid Tab-Wechsel:** Beim Wechsel zwischen Sprint Goal und PI Objective erscheint ein `ConfirmDialog` — der Output geht verloren. Das ist explizit: lieber einen Dialog zu viel als Silent Data Loss.

---

### Test Case Generator — Sidebar-History

**Entscheid:** TCG hat eine persistente Sidebar mit allen gespeicherten Testplänen und URL-Routing (`/test-cases/:id`).

**Warum:** Testpläne werden häufig wiederkehrend genutzt — vor Releases, bei Regressionstests, beim Onboarding neuer Tester. Eine scrollbare Liste mit Direktlink ist effizienter als jedes Mal neu generieren. Story Generator hat keine History-Sidebar weil Stories einmalig entstehen (write-once).

**UX-Entscheid Jira-Export:** Markdown-Format ist direkt in Jira-Tabellen einfügbar. Kein eigenes Jira-API-Call — Copy-Paste ist für einen Single-User-Workflow ausreichend.

---

### Doc Generator — Zwei Modi

**Entscheid:** Story-Modus vs. Feature-Modus mit unterschiedlichen max_tokens (4000/6000).

**Warum:** Eine Story-Dokumentation ist kürzer und präziser. Ein Feature-Dokument deckt mehr Kontext, mehr Sections, mehr Entscheide ab. Zwei Modi mit unterschiedlichem Prompt verhindern dass der PO immer den maximalen Token-Verbrauch hat.

**UX-Entscheid Ephemer:** Doc Generator speichert nicht. Jede Session beginnt neu. Rationale: Dokumentationen landen in Confluence — der Browser ist nur das Werkzeug, nicht das Archiv.

---

### Text Polisher — Use-Case-spezifischer Ton

**Entscheid:** Ton-Auswahl (formell/neutral/informell) nur bei E-Mail-Modus aktiv.

**Warum:** Meeting-Protokolle haben einen definierten Stil (klar, sachlich, protokollarisch). Freitext soll so bleiben wie es ist, aber sprachlich aufgewertet. Nur E-Mails variieren im Ton — daher die Einschränkung.

---

## 4. Accessibility-Status (WCAG 2.1 AA)

### Erfüllt

| Kriterium | Wie umgesetzt |
|---|---|
| **1.4.3 Kontrast Text (AA)** | brand auf surface ≈ 14:1; ink auf canvas ≈ 12:1. Dark-Mode-Tokens neu kalibriert. |
| **2.1.1 Keyboard** | Alle interaktiven Elemente per Tab erreichbar. Arrow-Key-Navigation in Tab-Gruppen. |
| **2.4.3 Focus Order** | Logische DOM-Reihenfolge, kein `tabindex > 0`. |
| **2.4.7 Focus Visible** | Globaler `focus-visible` Fokus-Ring (2px brand). |
| **2.4.1 Skip Link** | Skip-Link zu `#main-content` im ProtectedLayout. |
| **4.1.2 Name, Role, Value** | `role="tablist/tab"` in AppShell/DocModeSelector, `role="radiogroup/radio"` in ToneSelector, `role="alertdialog"` in ConfirmDialog. |
| **4.1.3 Status Messages** | `role="alert"` + `aria-live="assertive"` in `InlineError`, `role="status"` in `LoadingSkeleton`. |
| **1.3.1 Info and Relationships** | Labels via `<label for>` oder `aria-label` auf allen Inputs. |
| **2.5.3 Touch-Target** | Alle interaktiven Targets ≥ 44×44px (Tailwind `min-h-11` / `py-2.5`). |

### Offene Punkte

| Kriterium | Status | Beschreibung |
|---|---|---|
| **2.4.11 Focus Appearance (AA, WCAG 2.2)** | 🟡 Teilweise | Fokus-Ring sichtbar; in einigen Tailwind-Komponenten wird `outline: none` ohne Ersatz gesetzt. Audit ausstehend. |
| **1.4.10 Reflow** | 🟡 Nicht getestet | 320px-Viewport-Tests ausstehend. AppShell könnte bei kleinen Viewports horizontal scrollen. |
| **Accordion / SegmentedControl** | 🟡 Nicht auditiert | Keyboard-Navigation in diesen Komponenten nicht vollständig geprüft. |
| **Snackbar Auto-Dismiss** | 🔴 Offen | WCAG 2.2.1 (Timing Adjustable): Wenn ein Auto-Dismiss eingebaut wird, muss Nutzer es pausieren oder deaktivieren können. Aktuell kein Timer vorhanden — kein Problem. Beim Hinzufügen eines Auto-Dismiss: WCAG-Check nötig. |

### Keyboard-Navigation

- **Tab/Shift-Tab:** Navigation zwischen allen interaktiven Elementen
- **Arrow Keys:** Navigation innerhalb von Tab-Gruppen (`role="tablist"`), Radio-Gruppen
- **Escape:** Schliesst Dialoge (`ConfirmDialog`, `SettingsDialog`)
- **Enter/Space:** Aktiviert fokussierte Buttons
- **Programmatischer Fokus:** Nach AI-Generierung geht Fokus auf Output-Container (`tabIndex={-1}` + `useEffect`)
