# DESIGN.md — MockInterview Arena and Lab visual system (binding)

Status: binding for every implementer. If a component is not covered here, build it from the
tokens and recipes below. Do not add new colours, fonts, radii or shadows without changing
this file first. Read `docs/SPEC.md` first; this file only covers how things look and behave.

Tailwind is the only styling tool. No component libraries (see `docs/WORKER_RULES.md` rule 6).

---

## 1. Brand concept and name treatment

**Concept: "Instrument panel."** The two sites are one instrument with two faces. **Arena** is
the *record*: the settled scoreboard of a season. It is quiet, aligned and exact. **Lab** is the
*bench*: where the numbers get argued over by people and agents. It is the same system with a
slightly looser layout. Both use one neutral graphite palette and one accent hue, **pine**
(a deep blue-green). Pine is not a cyan-blue, so it does not read as any competition platform's
brand. Nothing is decorative. The page's colour comes from data, status and the single accent.

**Wordmarks.**

```
[MI]  MockInterview / Arena        <- Arena: solid tile (accent fill, white "MI")
[MI]  MockInterview / Lab          <- Lab: hollow tile (1.5px accent border, accent "MI")
```

- Tile: 24x24px (28px at `md` and up), `rounded-[6px]`, letters "MI" in the mono face, 11px/600,
  tracking `-0.02em`, centred.
- Text: "MockInterview" in `text-fg-secondary` at weight 500, then a slash in `text-fg-muted`, then
  the site name in `text-fg` at weight 600. Below 390px, hide "MockInterview /" and show only
  tile + site name.
- How they relate: same tile, same type, same accent. Only the fill differs (solid = record,
  hollow = work in progress). The site switcher (section 5.1) repeats this metaphor, so users
  always see which face they are on.
- Never: gradients, glows, a trophy or medal icon, mascots, or emoji in the wordmark.

**Rationale.** The sites track a real startup as if it were a competition. Credibility comes
from the numbers being legible and honest, not from decoration. A graphite neutral base with
one pine accent keeps the pages calm and lets the Example badges, status pills and chart series
carry the meaning. This avoids the warm-cream editorial look and the purple-gradient AI look.
The solid/hollow tile gives the two sites a shared identity with an obvious difference, using
nothing a reviewer could mistake for a borrowed platform brand.

---

## 2. Typography

Two families total: one UI sans and one monospace. **No serif anywhere.**

| Role | Family | `next/font/google` import | CSS variable |
|---|---|---|---|
| UI, headings, prose | **IBM Plex Sans** (weights 400, 500, 600) | `IBM_Plex_Sans` | `--font-sans` |
| Numbers, code, ranks, dates in tables, mono labels | **IBM Plex Mono** (weights 400, 500, 600) | `IBM_Plex_Mono` | `--font-mono` |

```ts
// app/fonts.ts (one copy per app, identical)
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
export const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-sans", display: "swap" });
export const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-mono", display: "swap" });
// <html className={`${sans.variable} ${mono.variable}`}>
```

No other weights. No italics except inside markdown prose (`em`). Plex Sans italic is allowed
there because the browser synthesises it from the same family. Do not load a third family.

### Type scale (mobile first; `md:` changes listed where they apply)

| Token / class | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| `text-display` | 30/36 px → `md:` 40/44 | 600 | -0.02em | Competition masthead title only |
| `text-h1` | 24/30 → `md:` 28/34 | 600 | -0.015em | Page titles (ledger, thread title) |
| `text-h2` | 19/26 → `md:` 20/28 | 600 | -0.01em | Card titles, section headings |
| `text-h3` | 16/24 | 600 | 0 | Sub-sections, board titles in lists |
| `text-body` | 15/24 → `md:` 16/26 | 400 | 0 | Default text, prose |
| `text-small` | 13/20 | 400 / 500 | 0 | Meta lines, table text, helper text |
| `text-micro` | 12/16 | 500 | 0.02em | Badges, pill labels, axis labels (never smaller than 12px) |
| `text-num` (mono) | 14/20 | 500 | 0 | Table numbers, ranks, ledger values |
| `text-num-lg` (mono) | 24/28 → `md:` 28/32 | 500 | -0.01em | Headline stats (best value, net, margin) |

Rules:
- Body text is never below 15px on mobile. Table body text is `text-small` (13px).
- Headings use sentence case. Do not use ALL CAPS except for `text-micro` badge labels, and even
  there prefer sentence case.
- Every digit that sits in a column, a stat or a chart tick uses the mono face plus the `tnum`
  class. Dates inside tables are mono too. Dates in running prose and meta lines stay sans, with
  `tnum` applied.
- Paragraph max width is `max-w-prose` (65ch).

---

## 3. Colour tokens

All colour comes from CSS variables. Light and dark are **separately tuned sets**. Dark is not
an inversion: its surfaces get lighter as they rise (bg < surface < raised), the accent is a
lighter, less saturated pine, and status colours are raised in lightness so they sit at the
same perceived weight on a dark ground.

### 3.1 Light theme (`:root`, `[data-theme="light"]`)

| Token | Hex | Notes |
|---|---|---|
| `--bg` | `#f4f5f7` | Page background (cool graphite-white, never cream) |
| `--surface` | `#ffffff` | Cards, tables, header |
| `--surface-raised` | `#ffffff` | Menus, toasts, popovers. Separated from surface by `shadow-pop` + border |
| `--surface-sunken` | `#eceef1` | Table header row, code blocks, input wells, skeleton base |
| `--fg` | `#15181d` | Primary text |
| `--fg-secondary` | `#454c57` | Secondary text, labels |
| `--fg-muted` | `#646b76` | Meta, helper text, axis labels |
| `--border` | `#dde1e6` | Hairlines, card borders, table rules (decorative, not relied on) |
| `--border-strong` | `#7d8590` | Input borders, toggle off-track, focusable control outlines (≥3:1) |
| `--accent` | `#0b6b58` | Pine. Links, primary buttons, active tab, progress fill |
| `--accent-hover` | `#08584a` | Hover/pressed for accent |
| `--accent-subtle` | `#e2f1ed` | Selected row tint, Arena tile hover, info backgrounds |
| `--accent-fg` | `#ffffff` | Text on accent |
| `--positive` | `#167044` | Better-than-target, net > 0, "Open" |
| `--positive-subtle` | `#e3f3ea` | Pill background |
| `--negative` | `#b42318` | Errors, net < 0, danger |
| `--negative-subtle` | `#fbe9e7` | Error field background, danger pill |
| `--negative-fg` | `#ffffff` | Text on danger button |
| `--warning` | `#8a5a00` | Example badge text, "Upcoming" |
| `--warning-subtle` | `#fbf0db` | Example badge background |
| `--focus` | `#1d5fd1` | Focus ring (deliberately not pine, so focus is distinct from selection) |
| `--grid` | `#e6e9ed` | Chart gridlines |

### 3.2 Dark theme (`[data-theme="dark"]`)

| Token | Hex | Notes |
|---|---|---|
| `--bg` | `#0d1014` | Near-black graphite with a cool cast |
| `--surface` | `#14181d` | Cards, tables, header |
| `--surface-raised` | `#1b2026` | Menus, toasts. Elevation is shown by lightness, not shadow |
| `--surface-sunken` | `#0a0c0f` | Table header, code, input wells |
| `--fg` | `#e8ebef` | Primary text (not pure white, to reduce glare) |
| `--fg-secondary` | `#b4bbc5` | |
| `--fg-muted` | `#8f97a2` | |
| `--border` | `#2a3038` | |
| `--border-strong` | `#6b7480` | Inputs, toggles (≥3:1) |
| `--accent` | `#4fc8a8` | Lighter pine, slightly desaturated relative to light |
| `--accent-hover` | `#6fd6ba` | Hover gets *lighter* in dark mode |
| `--accent-subtle` | `#10302a` | |
| `--accent-fg` | `#062019` | Dark text on the light accent (white would fail) |
| `--positive` | `#5ccf8f` | |
| `--positive-subtle` | `#11301f` | |
| `--negative` | `#ff8a7d` | |
| `--negative-subtle` | `#3a1714` | |
| `--negative-fg` | `#2a0906` | Dark text on danger button (white on `#ff8a7d` is 2.29:1, which fails) |
| `--warning` | `#e6b450` | |
| `--warning-subtle` | `#33270e` | |
| `--focus` | `#7fb0ff` | |
| `--grid` | `#232930` | |

### 3.3 Chart categorical palette (6 steps, fixed order, never cycled)

Validated with the dataviz palette validator (`validate_palette.js`). Checks: lightness band,
chroma floor, adjacent CVD separation, normal-vision floor, and 3:1 contrast against the chart
surface. **All PASS in both modes.**

| Slot | Hue | Light (`--chart-n`) | Dark (`--chart-n`) |
|---|---|---|---|
| 1 | pine | `#00876b` | `#16997b` |
| 2 | violet-slate | `#6c5bc4` | `#7d70dc` |
| 3 | ember | `#d9622a` | `#d86a30` |
| 4 | blue | `#2f6fd6` | `#4079d8` |
| 5 | ochre | `#b98500` | `#b08418` |
| 6 | rose | `#c2457e` | `#cc5288` |

Validator results:
- Light, on `#ffffff`: worst adjacent CVD ΔE 15.3 (deutan), normal-vision ΔE 21.9, all slots ≥ 3:1.
- Dark, on `#14181d`-class surface: worst adjacent CVD ΔE 12.8, normal-vision ΔE 20.4, all slots ≥ 3:1.

Rules:
- Series always take slots in order 1, 2, 3, … A series keeps its colour when filters remove
  others. A seventh series becomes "Other" (`--fg-muted`).
- Status colours (positive, negative, warning) are **never** used as series colours.
- Slot 1 is close to the accent on purpose: the first series is "ours" (revenue, best entry).
- Text never takes a series colour. Labels and values use `--fg` / `--fg-secondary`, with a
  coloured swatch next to them.

### 3.4 Contrast ratios (WCAG 2.x, computed)

Text needs 4.5:1. Large text and UI components need 3:1.

| Pair | Light | Dark |
|---|---|---|
| fg on bg / surface / raised / sunken | 16.31 / 17.79 / 17.79 / 15.31 | 15.95 / 14.91 / 13.71 / 16.38 |
| fg-secondary on bg / surface / sunken | 7.94 / 8.66 / 7.45 | 9.86 / 9.21 / 10.12 |
| fg-muted on bg / surface / raised / sunken | 4.93 / 5.38 / 5.38 / 4.62 | 6.46 / 6.04 / 5.55 / 6.64 |
| accent (as text/link) on bg / surface / sunken | 5.91 / 6.45 / 5.54 | 9.22 / 8.62 / 9.47 |
| accent-fg on accent / accent-hover | 6.45 / 8.38 | 8.27 / 9.77 |
| accent on accent-subtle | 5.54 | 6.87 |
| positive on surface / positive-subtle | 6.11 / 5.32 | 9.15 / 7.35 |
| negative on surface / negative-subtle | 6.57 / 5.61 | 7.79 / 7.00 |
| negative-fg on negative | 6.57 | 8.05 |
| warning on surface / warning-subtle | 5.93 / 5.25 | 9.34 / 7.66 |
| border-strong on surface (UI, 3:1) | 3.73 (3.42 on bg) | 3.76 (3.46 on raised) |
| focus ring on bg / surface | 5.33 / 5.82 | 8.68 / 8.11 (7.46 on raised) |
| `--border` on surface | 1.31 (decorative only) | 1.34 (decorative only) |

`--border` is decorative. Never let it be the only boundary of an interactive control. Inputs,
toggles and secondary buttons use `--border-strong`.

### 3.5 CSS (shared `tokens.css`, imported by both apps)

```css
:root, [data-theme="light"] {
  color-scheme: light;
  --bg:#f4f5f7; --surface:#ffffff; --surface-raised:#ffffff; --surface-sunken:#eceef1;
  --fg:#15181d; --fg-secondary:#454c57; --fg-muted:#646b76;
  --border:#dde1e6; --border-strong:#7d8590;
  --accent:#0b6b58; --accent-hover:#08584a; --accent-subtle:#e2f1ed; --accent-fg:#ffffff;
  --positive:#167044; --positive-subtle:#e3f3ea;
  --negative:#b42318; --negative-subtle:#fbe9e7; --negative-fg:#ffffff;
  --warning:#8a5a00; --warning-subtle:#fbf0db;
  --focus:#1d5fd1; --grid:#e6e9ed;
  --chart-1:#00876b; --chart-2:#6c5bc4; --chart-3:#d9622a; --chart-4:#2f6fd6; --chart-5:#b98500; --chart-6:#c2457e;
  --shadow-color: 220 20% 20%;
}
[data-theme="dark"] {
  color-scheme: dark;
  --bg:#0d1014; --surface:#14181d; --surface-raised:#1b2026; --surface-sunken:#0a0c0f;
  --fg:#e8ebef; --fg-secondary:#b4bbc5; --fg-muted:#8f97a2;
  --border:#2a3038; --border-strong:#6b7480;
  --accent:#4fc8a8; --accent-hover:#6fd6ba; --accent-subtle:#10302a; --accent-fg:#062019;
  --positive:#5ccf8f; --positive-subtle:#11301f;
  --negative:#ff8a7d; --negative-subtle:#3a1714; --negative-fg:#2a0906;
  --warning:#e6b450; --warning-subtle:#33270e;
  --focus:#7fb0ff; --grid:#232930;
  --chart-1:#16997b; --chart-2:#7d70dc; --chart-3:#d86a30; --chart-4:#4079d8; --chart-5:#b08418; --chart-6:#cc5288;
  --shadow-color: 0 0% 0%;
}
```

**Theme selection.** `data-theme` on `<html>` is `light`, `dark`, or missing. When it is missing,
an inline pre-paint script in `<head>` sets it from `localStorage.theme`, falling back to
`prefers-color-scheme`. This avoids a flash of the wrong theme. The toggle writes
`localStorage.theme` and `data-theme`. Both apps must use the same storage key, `mi-theme`.

---

## 4. Tailwind mapping

Target Tailwind CSS v4 (CSS-first config). If the scaffold pins v3, put the same mapping in
`theme.extend` with `colors: { bg: "var(--bg)", ... }`. The names must stay identical.

```css
/* globals.css */
@import "tailwindcss";
@import "./tokens.css";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-sunken: var(--surface-sunken);
  --color-fg: var(--fg);
  --color-fg-secondary: var(--fg-secondary);
  --color-fg-muted: var(--fg-muted);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-subtle: var(--accent-subtle);
  --color-accent-fg: var(--accent-fg);
  --color-positive: var(--positive);
  --color-positive-subtle: var(--positive-subtle);
  --color-negative: var(--negative);
  --color-negative-subtle: var(--negative-subtle);
  --color-negative-fg: var(--negative-fg);
  --color-warning: var(--warning);
  --color-warning-subtle: var(--warning-subtle);
  --color-focus: var(--focus);
  --color-grid: var(--grid);
  --color-chart-1: var(--chart-1); --color-chart-2: var(--chart-2); --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4); --color-chart-5: var(--chart-5); --color-chart-6: var(--chart-6);

  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, SFMono-Regular, monospace;

  --text-display: 1.875rem; --text-display--line-height: 2.25rem;
  --text-h1: 1.5rem;        --text-h1--line-height: 1.875rem;
  --text-h2: 1.1875rem;     --text-h2--line-height: 1.625rem;
  --text-h3: 1rem;          --text-h3--line-height: 1.5rem;
  --text-body: 0.9375rem;   --text-body--line-height: 1.5rem;
  --text-small: 0.8125rem;  --text-small--line-height: 1.25rem;
  --text-micro: 0.75rem;    --text-micro--line-height: 1rem;
  --text-num: 0.875rem;     --text-num--line-height: 1.25rem;
  --text-num-lg: 1.5rem;    --text-num-lg--line-height: 1.75rem;

  --radius-sm: 4px;   /* badges, pills, checkboxes, progress bar */
  --radius-md: 6px;   /* buttons, inputs, tabs focus, wordmark tile */
  --radius-lg: 10px;  /* cards, tables wrapper, toasts, menus */
  /* rounded-full only for the toggle switch and avatar circles */

  --shadow-card: 0 1px 2px hsl(var(--shadow-color) / 0.06);
  --shadow-pop: 0 4px 16px -4px hsl(var(--shadow-color) / 0.18), 0 1px 2px hsl(var(--shadow-color) / 0.08);
}

@utility tnum { font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1; }
@utility num  { font-family: var(--font-mono); font-variant-numeric: tabular-nums slashed-zero; font-feature-settings: "tnum" 1, "zero" 1; }

@layer base {
  html { @apply bg-bg text-fg font-sans antialiased; }
  body { @apply text-body; }
  @media (min-width: 48rem) {
    :root { --text-display: 2.5rem; --text-display--line-height: 2.75rem;
            --text-h1: 1.75rem; --text-h1--line-height: 2.125rem;
            --text-h2: 1.25rem; --text-h2--line-height: 1.75rem;
            --text-body: 1rem; --text-body--line-height: 1.625rem;
            --text-num-lg: 1.75rem; --text-num-lg--line-height: 2rem; }
  }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
}
```

(If responsive `--text-*` overrides do not take effect in the pinned Tailwind version, use the
explicit `md:text-[..]` pairs from the type-scale table instead.)

- **Shadows:** two only. `shadow-card` is used in light mode on cards. In dark mode cards have no
  shadow (`dark:shadow-none`) and rely on surface lightness plus a border. `shadow-pop` is for
  menus and toasts in both themes.
- **Spacing rhythm:** 4px base grid. Use only these steps: 1, 2, 3, 4, 6, 8, 12, 16 (=4, 8, 12, 16,
  24, 32, 48, 64 px). Stack gaps: inside a card `space-y-4`; between cards `gap-4 md:gap-6`;
  between page sections `space-y-8 md:space-y-12`. Card padding `p-4 md:p-6`. Table cell padding
  `px-3 py-2.5` (`md:px-4`).
- **Borders:** 1px everywhere (`border`), except the active tab indicator (2px) and the hollow Lab
  tile (1.5px).
- **Motion:** `duration-150 ease-out` for colour/opacity, `duration-200` for transforms. Nothing
  longer than 200ms. Everything is wrapped in `motion-safe:`, or reduced via the global rule in
  section 8.

---

## 5. Component specs

Recipes are the baseline class lists. You may add layout utilities. Do not change colour,
radius, type or shadow utilities.

### 5.1 App header (site switcher + theme toggle)

Structure: `<header>` contains, left to right: wordmark, site switcher, flexible spacer, auth
control, and theme toggle. Sticky.

```
header:   sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80
inner:    mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6
wordmark: inline-flex items-center gap-2 text-small md:text-body font-semibold text-fg
tile Arena: grid size-6 md:size-7 place-items-center rounded-md bg-accent text-accent-fg num text-[11px] font-semibold
tile Lab:   grid size-6 md:size-7 place-items-center rounded-md border-[1.5px] border-accent text-accent num text-[11px] font-semibold
```

**Site switcher.** A two-segment control. The segments are *links*, not buttons, because each
goes to the other app for the same slug.

```
nav (aria-label="Site"):   inline-flex rounded-md border border-border bg-surface-sunken p-0.5
segment:                   inline-flex min-h-9 items-center gap-1.5 rounded-[5px] px-3 text-small font-medium text-fg-secondary hover:text-fg
segment current:           bg-surface text-fg shadow-card dark:bg-surface-raised   (+ aria-current="page")
segment dot:               size-2 rounded-[2px] bg-accent (Arena) | size-2 rounded-[2px] border border-accent (Lab)
```

On mobile (<640px) the switcher stays visible, shows "Arena" and "Lab" only, and the wordmark
collapses to tile + nothing (the switcher already names the site).

**Theme toggle.** One icon button that cycles light → dark → system. Its accessible name states
the current value and the next action, e.g. `aria-label="Theme: dark. Switch to system"`. Icons
are sun, moon and half-circle, as inline SVG with 1.5px strokes, 18px, in `currentColor`.

```
icon button: inline-flex size-10 items-center justify-center rounded-md text-fg-secondary hover:bg-surface-sunken hover:text-fg
```

### 5.2 Competition masthead

```
wrapper:  border-b border-border bg-surface
inner:    mx-auto max-w-6xl px-4 md:px-6 pt-6 pb-0 md:pt-10
eyebrow:  text-small text-fg-muted              e.g. "Season · mock-interview-v5"  (slug in num)
title:    mt-1 text-display font-semibold tracking-[-0.02em] text-fg text-balance
meta row: mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-fg-secondary
dates:    tnum — "1 Sep 2026 – 31 Oct 2026" with <time datetime>; use an en dash, no "to"
pill:     inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-micro font-medium
          Open:     bg-positive-subtle text-positive
          Upcoming: bg-warning-subtle text-warning
          Closed:   bg-surface-sunken text-fg-secondary
          pill dot: size-1.5 rounded-full bg-current
```

Below the meta row comes the tab navigation (5.3), which sits flush on the masthead's bottom
border. There is no hero image, illustration or gradient banner. Owner-only actions ("Edit
page") are secondary buttons placed top-right on `md` and above, and below the meta row on
mobile.

### 5.3 Tab navigation

Arena tabs: Overview, Description, Evaluation, Rules, Timeline, Leaderboard, and Ledger (owner
only, with a lock icon). Lab tabs: Discussion, Data, Agents. The tabs are **links**, one per
route. Use `nav aria-label="Competition sections"` with `aria-current="page"` on the active
link. Do *not* use `role="tablist"`: these are page navigations, not in-page panels.

```
scroller: -mx-4 mt-6 overflow-x-auto px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          plus mask: [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] md:[mask-image:none]
list:     flex min-w-max gap-1
link:     relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-small font-medium text-fg-secondary hover:text-fg
active:   text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent
```

On mount, the active tab scrolls into view (`scrollIntoView({inline:"center", block:"nearest"})`).
For in-page tabs that do need panels (the markdown editor's Write/Preview), use the ARIA tabs
pattern described in section 8.

### 5.4 Content card

```
card:        rounded-lg border border-border bg-surface p-4 md:p-6 shadow-card dark:shadow-none
card header: flex flex-wrap items-start justify-between gap-3 mb-4
card title:  text-h2 font-semibold text-fg
card meta:   text-small text-fg-muted
```

Do not nest cards inside cards. Use a `border-t border-border pt-4` divider within a card instead.
Stat cards (best value, net, margin, collection rate) have a label in `text-small text-fg-muted`,
then the value in `num text-num-lg text-fg`, then a delta/target line in `text-small` with a
positive/negative colour **plus** a sign and arrow glyph (▲/▼, `aria-hidden`), and a visually
hidden "up"/"down" word for screen readers.

### 5.5 Markdown prose

Hand-written styles, scoped to a `.prose-mi` class. Do not use the typography plugin defaults.
Raw HTML is never rendered (see SPEC).

```
.prose-mi                 max-w-prose text-body text-fg
  > * + *                 mt-4
  h1                      text-h1 font-semibold mt-10 first:mt-0
  h2                      text-h2 font-semibold mt-8 pb-2 border-b border-border
  h3                      text-h3 font-semibold mt-6
  p, li                   text-fg  (secondary text is never used for body prose)
  a                       text-accent underline decoration-1 underline-offset-[3px] hover:decoration-2
  strong                  font-semibold
  ul / ol                 pl-5 list-disc / list-decimal, marker:text-fg-muted, li + li mt-1.5
  blockquote              border-l-2 border-border-strong pl-4 text-fg-secondary
  code (inline)           num text-[0.875em] rounded-sm bg-surface-sunken px-1 py-0.5
  pre                     num text-small rounded-lg bg-surface-sunken p-4 overflow-x-auto
  hr                      border-border my-8
  table                   wrapped automatically in the data-table scroller (5.6); numeric cells right-aligned
  img                     max-w-full rounded-md border border-border (only https sources, alt required)
```

The live-preview editor uses a split view on `lg` and up (editor left, preview right, both
`min-h-[60vh]`). Below `lg` it uses Write/Preview tabs. The editor textarea is
`num text-small leading-6 bg-surface-sunken`.

### 5.6 Data table

Every table, including those inside markdown, sits in its own scroll container. The page never
scrolls horizontally.

```
region:   relative overflow-x-auto rounded-lg border border-border bg-surface
          (role="region" aria-labelledby="<caption id>" tabIndex={0} so keyboard users can scroll it)
table:    w-full min-w-[640px] border-collapse text-small   (min-w set per table so columns never crush)
caption:  sr-only, or visible above the region as text-h3
thead th: sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary
          border-b border-border whitespace-nowrap
tbody td: px-3 py-2.5 border-b border-border align-middle text-fg
last row: [&_tr:last-child_td]:border-b-0
row hover: hover:bg-surface-sunken/60   (no zebra striping)
numeric td/th: text-right num text-num tnum whitespace-nowrap
first column (label): sticky left-0 bg-surface (z-[5]); on scroll it gets a right border via [data-scrolled] state
```

- `md:` increases cell padding to `px-4`.
- Sticky header: inside an overflow container, `sticky top-0` sticks to the region, not the
  page. For long tables (more than 15 rows) also give the region `max-h-[70vh] overflow-y-auto`.
- Column order: rank, label, value, gap to target, date, source, evidence. The source note
  truncates with `max-w-[24ch] truncate` and a `title` attribute. On mobile it wraps under the
  label in `text-micro text-fg-muted`, which avoids an extra column.
- Units go in the header ("Value (SD, pts)", "Revenue (INR)"), not repeated in each cell.
- Negative numbers use a true minus sign "−" (U+2212), not a hyphen.
- Missing values show as an en dash "–" in `text-fg-muted`, never a blank cell or "0".
- Selected or owner-editing rows: `bg-accent-subtle`.

### 5.7 Rank cell

```
td: w-14 text-right num text-num tnum text-fg-secondary
```

- Ranks 1–3: `text-fg font-semibold` plus a 2px left bar on the cell (`shadow-[inset_2px_0_0_var(--accent)]`)
  for rank 1 only. **No medals, no gold/silver/bronze colours, no trophy icons.**
- Ties show the same rank with a trailing "=" (e.g. `2=`), with `aria-label="Tied 2nd"`.
- Example rows are ranked like others, and the Example badge sits in the label cell.
- Rows without a date or source note are not ranked (per SPEC). They render a muted "–" in the
  rank cell and the text "Unranked: needs date and source" in `text-micro text-warning`.

### 5.8 Progress bar to target

```
wrapper: flex items-center gap-3
track:   relative h-2 flex-1 overflow-hidden rounded-sm bg-surface-sunken ring-1 ring-inset ring-border
fill:    h-full rounded-sm bg-accent motion-safe:transition-[width] motion-safe:duration-200
target tick (when overshoot is possible): absolute inset-y-[-2px] w-0.5 bg-fg
label:   num text-small tnum text-fg-secondary whitespace-nowrap   e.g. "72% of target"
```

- Use `<div role="progressbar" aria-valuemin=0 aria-valuemax=100 aria-valuenow={pct} aria-valuetext="0.42 SD, target 0.30, 72% of the way">`.
- For "lower is better" boards, progress is `clamp((baseline − best) / (baseline − target))`, or
  whatever the shared `packages/db` function returns. The bar never shows invented values.
- When the target is met: fill `bg-positive` and label "Target met" with a check icon.
- When there is no target, do not render a bar. Show "No target set" in `text-fg-muted`.

### 5.9 Example badge

```
inline-flex items-center gap-1 rounded-sm border border-dashed border-warning/60 bg-warning-subtle px-1.5 py-px text-micro font-medium text-warning
```

The label text is always the word **"Example"**. Use `title="Placeholder value, not a real
measurement"`. In a numeric cell, put the badge in the label cell, not next to the number, so
digit alignment is kept. The number itself takes `text-fg-muted` so readers can see it is not
real. The dashed border is the non-colour cue that tells this badge apart from status pills.

### 5.10 Generated / Agent badges

The author type is always shown as text plus an icon, never by colour alone.

```
Agent:     inline-flex items-center gap-1 rounded-sm bg-accent-subtle px-1.5 py-px text-micro font-medium text-accent ring-1 ring-inset ring-accent/30
           icon: 12px square-with-node glyph (inline SVG), text "Agent"
Generated: same recipe with bg-surface-sunken text-fg-secondary ring-border-strong/40; text "Generated by Claude"
Hidden (owner view): bg-negative-subtle text-negative, text "Hidden"
```

Agent reply cards also get a 2px left border, `border-l-2 border-l-accent`, and the agent's name
in `num text-small`. The four structured sections (Observations, Suggestions, Biggest risk,
Missing information) each render as an `h4 text-small font-semibold text-fg-secondary` followed
by a list. Biggest risk sits in a `rounded-md bg-warning-subtle p-3` block with a warning icon.

### 5.11 Form fields + validation

```
label:      block text-small font-medium text-fg mb-1.5   (required: append " *" in text-negative aria-hidden + "required" attr)
input:      block w-full min-h-11 rounded-md border border-border-strong bg-surface px-3 text-body text-fg
            placeholder:text-fg-muted hover:border-fg-muted
            focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus focus-visible:border-focus
numeric input: + num tnum text-right   (inputMode="decimal")
textarea:   same + min-h-32 py-2.5 leading-6
select:     same + appearance-none pr-9, custom chevron SVG absolutely positioned
helper:     mt-1.5 text-small text-fg-muted   (id referenced by aria-describedby)
error state input: border-negative bg-negative-subtle/40 focus-visible:outline-negative   + aria-invalid="true"
error text: mt-1.5 flex items-start gap-1.5 text-small text-negative  (icon + message; id in aria-describedby)
form summary on submit failure: rounded-md border border-negative/40 bg-negative-subtle p-3 text-small text-fg, role="alert",
            lists links to each invalid field; focus moves to the summary
```

Field layout: one column on mobile. On `md` and up, ledger month fields use
`grid grid-cols-2 gap-x-6 gap-y-4`, with expenses grouped in a `fieldset` whose `legend` is
"Expenses". Validate on blur and on submit, not on every keystroke. Error copy says what to do,
e.g. "Add a source note before this entry can be ranked."

### 5.12 Buttons

Base: `inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-small font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed`. On touch layouts (below `md`) primary actions are `min-h-11`.

| Variant | Classes |
|---|---|
| primary | `bg-accent text-accent-fg hover:bg-accent-hover` |
| secondary | `border border-border-strong bg-surface text-fg hover:bg-surface-sunken` |
| danger | `bg-negative text-negative-fg hover:opacity-90` (destructive confirm only) |
| danger-quiet | `border border-negative/50 text-negative hover:bg-negative-subtle` ("Remove all examples", delete row) |
| ghost | `text-fg-secondary hover:bg-surface-sunken hover:text-fg` |
| small (modifier) | `min-h-8 px-2.5 text-micro` (tables only, and the row must still be ≥ 44px tall) |

Loading: keep the width, swap the icon for a 14px spinner (`motion-safe:animate-spin`), set
`aria-busy="true"`, and change the label to the gerund ("Saving…"). There is one primary
button per view. Destructive actions ("Remove all examples", "Delete month", "Revoke token")
open a confirm dialog with the danger variant.

### 5.13 Toggle switch (share publicly)

```
<button role="switch" aria-checked={on} aria-labelledby="share-label-<month>">
track: relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border-strong bg-surface-sunken
       transition-colors duration-150 aria-checked:border-accent aria-checked:bg-accent
thumb: size-4 translate-x-1 rounded-full bg-fg-muted transition-transform duration-200
       group-aria-checked:translate-x-6 group-aria-checked:bg-accent-fg
hit area: wrap in a label row with min-h-11; the whole row is clickable
state text (always visible, next to the switch): "Public" (text-positive) / "Private" (text-fg-muted)
```

The visible text label is required, because the switch's position alone does not explain what
it does. Turning a month public shows a toast: "March 2026 is now public. Revenue and paying
customers only."

### 5.14 Toast

```
region: fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:w-96
        (aria-live="polite"; errors use role="alert")
toast:  flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-3 pr-2 text-small text-fg shadow-pop
icon:   16px, text-positive / text-negative / text-fg-secondary
close:  ghost icon button size-8, aria-label="Dismiss"
```

Toasts auto-dismiss after 5s, except error toasts, which stay until dismissed. Hovering or
focusing a toast pauses the timer. Enter: `motion-safe:animate-[toast-in_150ms_ease-out]`
(fade + 8px rise). Under reduced motion there is opacity only.

### 5.15 Empty state

```
wrapper: rounded-lg border border-dashed border-border-strong/60 bg-surface px-6 py-10 text-center
icon:    mx-auto size-6 text-fg-muted (simple line icon, never an illustration or emoji)
title:   mt-3 text-h3 font-semibold text-fg
body:    mt-1 text-small text-fg-secondary max-w-sm mx-auto
action:  mt-4 (secondary button; primary only if it is the page's main action)
```

The copy is factual, e.g. "No entries yet. Entries need a date and a source note before they
are ranked." There are no jokes.

### 5.16 Skeleton

```
block: rounded-sm bg-surface-sunken motion-safe:animate-pulse
text line: h-3.5 w-full (vary widths 100% / 92% / 64%)
table skeleton: real thead + 5 rows of skeleton cells, so layout does not shift
```

Skeletons copy the real layout exactly, including heights. The container gets
`aria-busy="true"` and a visually hidden "Loading…" message. Do not show skeletons for loads
under 300ms.

---

## 6. Chart spec: revenue vs expenses (ledger)

**Form:** grouped vertical bars per month. Two series on **one shared currency axis**:
Revenue (`--chart-1`) and Total expenses (`--chart-2`). Net is not a third mark. It appears in
the tooltip and the table below. Do not use a dual axis, and do not stack revenue on expenses.
The four-way expense split (hosting, speech services, AI model usage, other) is shown in the
ledger table, not in this chart.

**Rendering:** hand-written inline `<svg>` in a React component. No chart library is required.
If one is used, it must be unstyled (for example d3-scale only). Colours come only from CSS
variables (`fill="var(--chart-1)"`), so the chart follows the theme with no JS.

**Geometry**
- Wrapper: `w-full`, measured with `ResizeObserver`. `viewBox` matches the measured pixel width;
  height is `h-64` on mobile and `md:h-80`.
- Margins: top 16, right 12, bottom 36, left = width of the widest y tick label + 12 (measure
  it, or use 56).
- Bars: band padding inner 0.3, outer 0.2. Within a month the two bars have a 2px gap. Bar width
  is capped at 28px. Top corners have a 3px radius (path), and the bottom stays square on the
  baseline.
- With more than 8 months on screens under 640px, the chart wrapper scrolls horizontally
  (`overflow-x-auto`, `min-w` = months × 44px) like a table. The y axis stays readable because
  the axis is rendered in a separate fixed-width SVG to the left.

**Scale and ticks**
- The Y domain starts at **0** and runs to `niceMax(max(revenue, expenses))`. Use 4–5 ticks at
  "nice" steps (1, 2, 2.5, 5 × 10ⁿ). If there is no data, show the empty state, not an empty
  axis.
- Y tick format: compact currency, `Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 })`
  e.g. "₹12.5K". The y axis title states the unit in full, e.g. "Amount (INR)", in `text-micro
  text-fg-muted`, horizontal, placed above the axis at top-left (do not rotate the text).
- X ticks: month abbreviations, "Jan", "Feb", … Add the year only on the first tick and on
  January ("Jan 26"). The x axis title "Month" is visually hidden but present for screen readers.
- All tick text: `font-family: var(--font-mono)`, 12px, `fill: var(--fg-muted)`, with `tnum`.

**Gridlines and axes**
- Horizontal gridlines at each y tick: `stroke: var(--grid)`, 1px, `shape-rendering: crispEdges`.
- Baseline (y=0): `stroke: var(--border-strong)`, 1px.
- No vertical gridlines, no y axis line, no tick marks on y. X tick marks are 4px in `--border-strong`.

**Legend**
- Placed above the plot, left-aligned, as an HTML (not SVG) `<ul>` with `flex gap-4 text-small
  text-fg-secondary`. Swatches are `size-2.5 rounded-[2px]` in the series colour, and the text
  is in text colours, never the series colour. Items: "Revenue", "Expenses (total)".
- Direct labels: only on the most recent month, above each bar, value in `num text-micro
  text-fg-secondary`. Do not put a number on every bar.

**Interaction**
- Each month has a hover/focus target that covers the full band height, wider than the bars.
  Bands are focusable (`tabIndex=0`, arrow keys move between months).
- The tooltip (`bg-surface-raised border border-border shadow-pop rounded-md p-2.5 text-small`)
  shows the month, revenue, expenses, net (with sign and a positive/negative colour plus a
  ▲/▼ glyph) and margin, all in `num tnum` with values right-aligned.
- The active band gets a `fill: var(--fg) / 0.04` background rect.

**Accessibility**
- `<figure>` with `<figcaption>` ("Revenue against total expenses, by month, INR").
- `svg` gets `role="img"` and `aria-labelledby` (caption) + `aria-describedby` pointing to a
  one-sentence summary ("Revenue exceeded expenses in 3 of 5 months; latest net +₹4.2K").
- A "Show as table" disclosure under the chart renders the same data in the data-table recipe.
- Example-flagged months render bars with a 45° hatch pattern (`<pattern>` stroke in the same
  series colour at 50% opacity over a 25% fill), and the tooltip shows the Example badge.
- In both themes no bar colour may be swapped by hand. Validation is covered by section 3.3.

The same axis, grid, legend and tooltip rules apply to any other chart (for example a
leaderboard's history sparkline: one series, `--chart-1`, 2px line, no legend).

---

## 7. Layout rules

**Breakpoints** (Tailwind defaults): `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Design at 390
first, then check 768, 1024 and 1440.

**Widths and gutters**
- Page container: `mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8` (1152px max content).
- Reading pages (description, evaluation, rules, a thread): content column `max-w-3xl` (768px).
  On `lg`+ an optional right rail of `w-72` holds metadata (season dates, board list, thread
  info). It sits in `lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10`.
- Data pages (leaderboard, ledger, data catalogue): full container width.
- Vertical page padding: `py-6 md:py-10`.
- Nothing may cause horizontal page scroll at 390px. Check with
  `document.documentElement.scrollWidth === 390`.

**Overview page (arena):** at 390px it is one column: summary card, key boards (as stat cards in
`grid grid-cols-1 gap-4`), then "From the lab" (latest three topics). At `md`, stat cards go to
`sm:grid-cols-2`. At `lg`, `lg:grid-cols-3`. "From the lab" is a list card with each topic as a
row: title (`text-body font-medium`), tag pill, and reply count in `num`.

**Discussion list (lab):** each thread is a row in one card (`divide-y divide-border`). At
390px the row stacks: title (2-line clamp), then the meta line (tag · author · relative date ·
replies). At 1440px the row is a grid
`grid-cols-[minmax(0,1fr)_8rem_6rem_7rem]` (title+tag | last activity | replies | author),
and numeric columns are right-aligned in `num`.

**Thread page at 390px**
- Title (`text-h1`), then meta, then the opening post as a card at full width.
- Replies run in a single column, separated by `divide-y divide-border` inside one card, or as
  separate cards with `space-y-3`. The reply header is avatar (24px circle, initials, or the
  agent glyph), name, badge, then date. The date wraps to a second line if needed.
- There is no indentation for nesting (threads are flat). If a reply quotes another, show a
  quote block.
- The reply form is at the bottom, in a full-width card. The textarea is `min-h-32`, and the
  "Post reply" button is full width (`w-full`). The secondary actions ("Ask Claude for
  observations", "Copy briefing", "Paste an agent's answer") sit in a horizontally scrollable
  row of secondary buttons *above* the form, or in a `details` disclosure labelled "Agent
  tools". The keyboard must not cover the submit button: the form is not sticky.
- The paste-back form (agent name + structured answer) opens inline below the trigger, never in
  a modal on mobile.

**Thread page at 1440px**
- Grid `lg:grid-cols-[minmax(0,1fr)_18rem] gap-10` inside `max-w-6xl`. The main column holds the
  opening post, replies (max line length 70ch), and the reply form.
- Right rail (sticky `top-20`): thread info (tag, created, replies count in `num`), an "Agent
  tools" card with the three agent actions as stacked secondary buttons, and the copyable
  briefing preview (`pre` with `max-h-64 overflow-auto`, plus a "Copy" ghost button).
- The reply form's buttons are right-aligned (`flex justify-end gap-2`) with the primary on the
  right.

**Ledger at 390px:** the stat cards (net, margin, collection rate) are a two-column grid. The
chart comes next, then the table in its scroll region. "Add month" is a full-width primary
button above the table. The form opens on its own route or inline, never as a modal.

---

## 8. Accessibility rules

- **Focus:** every interactive element shows `outline: 2px solid var(--focus); outline-offset: 2px`
  on `:focus-visible`. Never `outline-none` without a replacement. Inside scroll regions and on
  table rows use `outline-offset: -2px` so the ring is not clipped.
- **Hit sizes:** a minimum of 44×44px for touch targets below `md`, and 40×40px above. Icon
  buttons are `size-10` (`size-11` on mobile). Small table buttons must be inside a row that
  is ≥ 44px tall, and must be ≥ 24px with 8px spacing (WCAG 2.2 target-size minimum).
- **Navigation tabs:** `<nav aria-label>` + links + `aria-current="page"`. In-page tabs (editor
  Write/Preview, ledger Chart/Table) use `role="tablist"`, `role="tab"`, `aria-selected`,
  `aria-controls`, and roving `tabIndex`. Arrow keys move between tabs, and Home/End jump to the
  first/last tab. Panels have `role="tabpanel"` + `aria-labelledby` + `tabIndex=0`.
- **Toggles:** `role="switch"` + `aria-checked` + a visible label linked by `aria-labelledby`.
  The state is also shown as text (Public/Private).
- **Badges:** Example, Agent, Generated and Hidden are plain text inside a `span`, so they are
  read aloud as words. Do not hide them with `aria-hidden`. Their icons are `aria-hidden`. A row
  with an Example badge adds `title`/visible text; do not put the meaning only in `aria-label`.
- **Status:** colour is never the only cue. Use a sign, arrow glyph, icon or word together with
  positive/negative/warning colours.
- **Tables:** `<caption>` (it can be `sr-only`), `<th scope="col">`, `<th scope="row">` for the
  label column, and a scroll region with `role="region"`, `aria-labelledby` and `tabIndex=0`.
- **Forms:** every input has a `<label>`. Errors use `aria-invalid` + `aria-describedby`, and the
  error summary uses `role="alert"`, receives focus, and links to fields.
- **Live updates:** toasts are `aria-live="polite"` (errors use `role="alert"`). The Claude
  observations request announces "Generating observations…" and then the result or the
  "Not configured" state.
- **Reduced motion:** global rule
  `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`.
  Skeletons stop pulsing, and bar/progress transitions are instant.
- **Language and landmarks:** `<html lang="en">`, a skip link ("Skip to content", visible on
  focus, `fixed left-4 top-2 z-50 rounded-md bg-surface px-3 py-2 shadow-pop`), and
  `header`/`nav`/`main`/`footer` landmarks.
- **Zoom:** layouts must survive 200% zoom and a 320px viewport with no clipped controls.

---

## 9. Anti-patterns (do not ship)

1. Cream or beige backgrounds, serif headings, terracotta/orange accents: the "editorial AI" look.
2. Purple or blue-to-purple gradients, glassmorphism, glows, gradient text, or animated backgrounds.
3. Emoji or decorative icons as section markers or headings. Medals, trophies, confetti, or
   gold/silver/bronze rank colours.
4. Anything that resembles the competition platform the URLs are modelled on: its cyan-blue,
   its logo shapes, its tab wording beyond the generic route names, its medal system.
5. Proportional (non-tabular) digits in any column, stat or chart axis. Left-aligned numbers.
   Hyphens used as minus signs.
6. A table, `pre`, or chart that makes the *page* scroll sideways on a phone.
7. Dark mode made by inverting or by `filter: invert()`, pure `#000` backgrounds, pure `#fff`
   text, or reusing light-mode accent hexes in dark mode.
8. Raw Tailwind palette colours (`bg-gray-100`, `text-emerald-600`, `dark:bg-slate-900`) instead
   of tokens. Arbitrary hexes in components.
9. Status colours used as chart series, or series colours used for text.
10. Dual-axis charts, charts without a zero baseline for bars, unlabeled axes, or units missing
    from axes and table headers.
11. Showing a number without an Example badge when it is a placeholder. Hiding the badge on
    mobile.
12. Modals for primary forms on mobile, sticky footers that cover inputs, and hover-only
    affordances (every hover reveal must also work on focus and tap).
13. Spinners for page loads (use skeletons). Skeletons that do not match the final layout.
14. Extra font families or weights, ALL-CAPS headings, text below 12px.
15. `outline-none` without a visible replacement focus style.
