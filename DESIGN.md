---
name: JobNess
description: Modern digital console for a private, single-operator job hunt
colors:
  daybreak-cream: "#faf7f0"
  card: "#ffffff"
  soft: "#f4f0e6"
  softer: "#efeadd"
  hearth-ink: "#1a1815"
  hearth-ink-hover: "#2d2923"
  line: "#e5dfce"
  line-strong: "#d4cdb8"
  line-hover: "#c7bfa8"
  text-muted: "#6b6558"
  text-dim: "#767060"
  moss: "#3f5c2e"
  moss-soft: "#e6ece0"
  moss-soft-border: "#c9d3a8"
  solar-amber: "#8b3a2e"
  solar-amber-soft: "#f2e4e0"
  solar-amber-soft-border: "#d9b8b0"
  coastal-blue: "#3a5a7a"
  coastal-blue-soft: "#e4ebf2"
  coastal-blue-soft-border: "#b5c4d6"
typography:
  display:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Hanken Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
    fontFeature: "\"tnum\""
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
components:
  button-primary:
    backgroundColor: "{colors.hearth-ink}"
    textColor: "{colors.daybreak-cream}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.hearth-ink-hover}"
    textColor: "{colors.daybreak-cream}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "0"
    height: "36px"
    width: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.hearth-ink}"
  card-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.hearth-ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  card-row-focused:
    backgroundColor: "{colors.card}"
    textColor: "{colors.hearth-ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.hearth-ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px 6px 32px"
    height: "36px"
  chip-score-high:
    backgroundColor: "{colors.moss-soft}"
    textColor: "{colors.moss}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  chip-score-mid:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.hearth-ink}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: JobNess

## 1. Overview

**Creative North Star: "The Operator's Console"**

JobNess is a single-operator console for a private job hunt. Modern digital, decisive, quiet. The visual system rejects the busy, ad-laden recruiter feed (LinkedIn, Indeed) on one side and the neon glow of web3 / fintech-bro launch sites on the other. It sits in the lineage of Linear, Things 3, Plain, and Resend's product surfaces: confident sans typography, restrained motion, deliberate color.

The surface is a warm cream (`#faf7f0`) under near-black text (`#1a1815`) — both warm-tinted neutrals so the system has a temperature, but neither pretends to be paper. No grain, no faux texture, no serif "stamp" typography, no editorial flourish. Type does the heavy lifting: one modern grotesque sans (Hanken Grotesk) carries the entire hierarchy via scale + weight + tracking. Tabular numerics on every score, salary, and date. Surfaces are flat by default. Borders deepen one step on hover and one more on focus; selection inverts to ink-on-cream rather than lifting.

The five-color palette is fixed: Daybreak Cream as surface, Hearth Ink as text and selection inversion, Moss for "interested" and high-fit scores, Coastal Blue for "applied," Solar Amber for "due today" and destructive actions. No sixth color is permitted. Filled accents are preferred over soft tints when something needs to be the focal point of a screen.

This system explicitly rejects: the LinkedIn / Indeed feed (busy, ad-laden, social-network noise); web3 / crypto neon (glow, gradient, glassmorphism, "cybernetic" wireframes); editorial / paper-feel skeuomorphism (faux paper textures, serif stamp headlines, hand-set typography); the generic SaaS dashboard (purple gradients, identical card grids, hero-metric template, AI-slop polish); productivity gamification (streaks, confetti, completion meters).

**Key Characteristics:**
- Warm cream surface (Daybreak Cream `#faf7f0`) and warm near-black text (Hearth Ink `#1a1815`); never pure white, never pure black, never dark mode by default, never paper texture.
- One typeface (Hanken Grotesk) across the whole UI; hierarchy is scale + weight + tracking.
- Tabular numerics on all countables — scores, salaries, days-ago.
- Flat-by-default — borders, not shadows, carry hierarchy. The sole real shadow is on the modal panel.
- Five-color palette used decisively; the filled Moss score chip is the system's primary visual signature.
- Keyboard-first: every action has a key (`a` for applied, `i` for interested, `e` for email, `x` for archive, `g` + `f/c/o/s` to jump tabs); no animation announces success.

## 2. Colors: The Daybook Palette

The palette is restrained: tinted neutrals + three muted earth accents, each tied to a column or status. Saturation is low across the board — the brightest accent is closer to a pressed pigment than a printed ink.

### Primary
- **Hearth Ink** (`#1a1815`): the working text color, the selected pill background, the brand mark fill. A warm near-black with a green-brown undertone, never `#000`.
- **Hearth Ink Hover** (`#2d2923`): the only state lift Hearth Ink ever takes — used on the primary pill's hover.

### Secondary (Accents — one per column)
- **Moss** (`#3f5c2e`): the *interested* status color and the "applied this week" pulse. A garden green, not a brand green. Pairs with Moss Soft (`#e6ece0`) on chip backgrounds and Moss Soft Border (`#c9d3a8`) on chip strokes.
- **Solar Amber** (`#8b3a2e`): the *due today* and *destructive* color (archive, reject). A warm rust, never red. Pairs with Solar Amber Soft (`#f2e4e0`) on inline alerts and Solar Amber Soft Border (`#d9b8b0`).
- **Coastal Blue** (`#3a5a7a`): the *applied* status color. A slate blue, never sky. Pairs with Coastal Blue Soft (`#e4ebf2`) and Coastal Blue Soft Border (`#b5c4d6`).

### Neutral (the page itself)
- **Daybreak Cream** (`#faf7f0`): the page surface and dark-on-light text inverse. Carries a faint multiply-blended noise overlay for real-paper grain.
- **Card** (`#ffffff`): every raised surface — queue rows, modals, inputs, panels. The only true white in the system.
- **Soft** (`#f4f0e6`): hover surface for ghost buttons; subtle field tint.
- **Softer** (`#efeadd`): tonal divider where a 1px line would be too loud.
- **Line** (`#e5dfce`): default 1px border on every card, input, and pill.
- **Line Strong** (`#d4cdb8`): the header divider and any "this matters more" border.
- **Line Hover** (`#c7bfa8`): the one-step border lift on card hover.
- **Text Muted** (`#6b6558`): secondary copy, eyebrow labels, metadata.
- **Text Dim** (`#767060`): tertiary copy, disabled states, the opening-quote glyph in fit notes.

### Named Rules

**The Paper-Not-Phosphor Rule.** No `#000`, no `#fff` for text. No neon, no gradient, no glow, no dark mode. The surface is warm cream and the ink is warm near-black. Anything else is a regression.

**The One Accent Per Column Rule.** Moss = interested. Solar Amber = due / destructive. Coastal Blue = applied. Never paint a card with an accent. Never use an accent for visual interest. If a new column or status appears, it does not get a fourth accent — it gets a label.

**The Saturation Ceiling Rule.** The accents are intentionally muted earth tones. If a swatch looks bright next to its neighbors, it is wrong. Bright is for crypto dashboards.

## 3. Typography

**Single Family:** Hanken Grotesk (system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica fallback). Weights 400 / 500 / 600 / 700. No second family — no serif companion, no monospace accent.

**Character:** A modern grotesque, geometric enough to feel digital, humanist enough to feel warm. Hierarchy is built from scale + weight + letter-spacing, not from typographic contrast between families. The whole UI reads as one confident voice.

### Hierarchy
- **Display** (20px, weight 700, tracking -0.02em, leading-none): the "JobNess" brand mark in the header and login. Tight, decisive — the wordmark of a tool.
- **Headline** (24px on mobile / 28px on `>=sm`, weight 600, tracking -0.025em, line-height 1.15): page-level h2 — "Queue", "Settings", "Companies", "Outreach". One per view. The visual entry point.
- **Card title** (16px, weight 600, tracking -0.01em, line-height 1.15): the company name on every queue row and company card. Bold and clean, no serif.
- **Title** (14px, weight 600): section h3 inside settings cards — "Filters", "Blocklist", "CV".
- **Body** (13–14px, weight 400, line-height ~1.45): the job title in a row, the fit-note copy, descriptive paragraphs. Never set wider than 65–75ch even when there's room.
- **Label** (11px, weight 600, uppercase, tracking 0.05em, tabular-nums): the status eyebrow on each row ("new", "interested", "due today"). The only place uppercase appears.
- **Meta** (12–13px, weight 400, tabular-nums): salaries, dates, counts — anything with a number gets `font-variant-numeric: tabular-nums` and `letter-spacing: -0.01em`.

### Named Rules

**The One-Family Rule.** Hanken Grotesk handles every level of the hierarchy. No serif, no monospace. Hierarchy is built from scale, weight, and tracking. This is non-negotiable — pairing a second family would re-introduce the editorial flourish the system rejects.

**The Tabular Numerics Rule.** Every score, every salary, every date, every count uses `font-variant-numeric: tabular-nums`. Stacked rows of numbers must align column-true. Proportional digits are forbidden in any data column.

**The Uppercase Label Rule.** Uppercase is reserved for the 11px status eyebrow with letter-spacing 0.05em. Never use uppercase elsewhere — not on buttons, not on headings, not for emphasis.

## 4. Elevation

Flat by default. The system uses 1px borders and tonal surfaces to communicate hierarchy; shadows appear in exactly one place (the modal panel) and one circumstance (focused queue row gets a soft `shadow-md` to lift slightly above its neighbors). Selection does not lift — it inverts (Hearth Ink background, Daybreak Cream text). Hover does not lift — it deepens (border goes from Line to Line Hover).

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(26, 24, 21, 0.04)`): so subtle it reads as a soft edge, not depth. Used only where a card sits on a tinted background and would otherwise visually merge.
- **Modal** (`box-shadow: 0 20px 50px rgba(26, 24, 21, 0.18), 0 8px 20px rgba(26, 24, 21, 0.08)`): the only real shadow in the system. Two-layer, ink-tinted, falls long. Used exclusively on the dialog panel.
- **Focus row** (`shadow-md` Tailwind default): a quiet lift on the focused queue row to make keyboard position visible without breaking the flat doctrine.

### Named Rules

**The Flat-by-Default Rule.** Surfaces sit at the page level. No cards-within-cards. No nested elevation. If a thing needs to stand out, change its border or invert its color — do not lift it.

**The Borders-Do-the-Work Rule.** Hierarchy is carried by Line / Line Strong / Line Hover, not by shadow. Hover deepens; focus inverts the border to Hearth Ink with a 2px outline offset 2px outside.

**The One-Real-Shadow Rule.** The modal panel is the only surface allowed a true ink-tinted shadow. Everything else uses a 1px hairline at most.

## 5. Components

### Buttons
- **Shape:** rounded-md (6px) for pill buttons, rounded-sm (4px) for icon-only ghost buttons.
- **Primary** (the "selected tab" / "active filter" pill): Hearth Ink background, Daybreak Cream text, no border, height 36px, padding 0 12px. Hover deepens to Hearth Ink Hover. The same treatment is used on toggle pills in Settings when active.
- **Secondary** (default tab / inactive filter): transparent background, Text Muted color, transparent border. Hover transitions to Card background, Hearth Ink text, Line border. Same height as Primary so they sit row-true.
- **Ghost-icon** (every row's row-action buttons, 36×36): transparent at rest, Soft on hover, Text Muted → Hearth Ink. Three colored variants exist for semantic actions:
  - `btn-ghost-sage` → Moss text on Moss Soft hover (interested).
  - `btn-ghost-brick` → Solar Amber text on Solar Amber Soft hover (archive / destructive).
  - `btn-ghost-steel` → Coastal Blue text on Coastal Blue Soft hover (applied / send).

### Chips (Score chip)
- **Style:** rounded (4px), 1px border, padding 2px 8px, body weight 700, tabular-nums.
- **State:**
  - Score ≥ 85 → Moss Soft background, Moss Soft Border stroke, Moss text.
  - Score 70–84 → Soft background, Line border, Hearth Ink text.
  - Score < 70 → Soft background, Line border, Text Dim text.
- The score number is the only content; it speaks for itself.

### Status Pill (eyebrow + dot)
- A 1.5×1.5 colored dot (`rounded-full`) followed by an 11px uppercase label with letter-spacing 0.05em.
- Dot color: Moss for interested, Coastal Blue for applied, Line Strong for new, Text Dim for archive, Solar Amber for due-today.
- This is the system's primary status tell — every list and detail surface uses it.

### Cards / Queue Row
- **Corner Style:** rounded-lg (8px).
- **Background:** Card (`#ffffff`).
- **Shadow Strategy:** flat at rest. Border-only.
- **Border:** 1px Line at rest; Line Strong on hover; Hearth Ink on focus, plus a quiet `shadow-md` lift to communicate keyboard position.
- **Internal Padding:** 12px 16px.
- **Company name:** Hanken Grotesk 16px / 600 / tracking -0.01em. Bold, clean, no serif.
- **Row-action strip:** Heart (interested) → Mail (draft) → Check (applied) → Trash (archive) on inbox rows; Send → Check → Back → Trash on interested rows. 36×36 ghost icons, opacity 0.6 at rest and 1.0 on `:hover` / `:focus-within`, separated from the row body by a 1px Line top divider. Each action has a single-key keyboard equivalent (`i`, `e`, `a`, `x`).

### Inputs / Fields
- **Style:** Card background, 1px Line border, rounded-md (6px), height 36px, body-size text, Text Dim placeholder.
- **Search variant** has a 13px icon left-pinned at 12px and `padding-left: 32px`.
- **Focus:** `outline: 2px solid Hearth Ink; outline-offset: 1px` (inputs) or 2px (buttons). No border color shift, no glow, no animated underline.
- **Range slider** uses `accent-color: Hearth Ink`; everything else inherits.

### Modal
- **Panel:** Card background, 1px Line border, rounded-xl (12px), `shadow-modal` (the only true shadow). Max width 2xl, max height 85vh.
- **Backdrop:** Hearth Ink at 40% alpha — paper-tinted, not pure black.
- **Entrance:** backdrop fades over 0.18s; panel translates from `translateY(6px) scale(0.99)` to rest over 0.2s with cubic-bezier(0.4, 0, 0.2, 1).
- **Focus:** trapped inside the panel; first focusable element receives focus; Escape closes; restore-focus on unmount.

### Navigation (Tab bar)
- A row of pill buttons inside the sticky header, each 36px tall. Selected state uses the Primary button treatment; unselected uses Secondary. Each carries a 13px icon and a 13px label, separated by 6px. Mobile collapses to a native `<select>` with the matching icon left-pinned.
- **Keyboard:** ArrowLeft/Right cycles, Home/End jumps to ends. The `g`-prefix shortcut (`g f`, `g c`, `g o`, `g s`) jumps directly to a tab from anywhere except inside an input.

### Signature: The Filled Moss Score Chip
- For any job scoring ≥ 85, the score chip flips from a soft sage tint to **filled Moss with Daybreak Cream text** (`bg-forest t-paper b-forest`). It is the single most visually committed element in the system, and it earns its weight: a 92 should pull your eye to the row before your eye finds the company name.
- 70–84 scores use a neutral Soft fill with Hearth Ink text — present, but not the focal point.
- < 70 scores fade back to Card-on-Card with Text Dim — visible but quiet.
- This three-step ladder (filled accent → neutral → ghost) is the visual rhythm of the queue. It is the system's primary signature now that the paper texture is gone.

## 6. Do's and Don'ts

### Do:
- **Do** keep the surface warm cream (Daybreak Cream `#faf7f0`) and the text warm near-black (Hearth Ink `#1a1815`). The warmth is the only "personality" the surface carries; nothing else needs to be added.
- **Do** use Hanken Grotesk for every level of the hierarchy. Build hierarchy from scale, weight, and tracking — never from a second typeface.
- **Do** use tabular numerics on every score, salary, date, and count. Stacked numbers must align column-true.
- **Do** use the three accents (Moss, Solar Amber, Coastal Blue) only as semantic column markers. Moss = interested + applied-this-week + high-fit. Coastal Blue = applied. Solar Amber = due today + destructive.
- **Do** prefer filled accent treatments over soft tints when something needs to be the focal point of a screen. The filled Moss score chip on a high-fit job is the canonical example.
- **Do** keep surfaces flat. Borders deepen on hover (Line → Line Hover); focus inverts the border to Hearth Ink with a 2px outline offset 2px outside.
- **Do** use the Primary button treatment (Hearth Ink + Daybreak Cream) for the *one* selected pill in any toggle or tab group. Inversion is the selection tell.
- **Do** add new animations only via opacity and transform with ease-out-quart / quint curves, and always check `prefers-reduced-motion: reduce`.
- **Do** make every action keyboard-reachable. The single-key shortcuts on the queue (`i`, `e`, `a`, `x`), the `g`-prefix tab jump, and the `?` overlay set the bar — new features inherit it.

### Don't:
- **Don't** drift toward the **LinkedIn / Indeed style**: busy, ad-laden, recruiter-shaped UX, social-network noise, "people you may know," skill endorsements. JobNess is the antidote.
- **Don't** drift toward **web3 / crypto neon**: glow effects, animated gradients, glassmorphism, neon-on-black palettes, "cybernetic" wireframes, glassy backdrop-blurs. JobNess is a working tool, not a launch site for a token.
- **Don't** drift toward **editorial / paper-feel skeuomorphism**: faux paper textures (`feTurbulence` noise overlays, multiply-blended grain), serif "stamp" headlines, hand-set typography, opening-quote glyphs as ornament. The surface is digital; it should not pretend to be vellum.
- **Don't** drift toward **generic SaaS dashboard** clichés: identical card grids, gradient text, purple accents, the hero-metric template, AI-slop polish.
- **Don't** add productivity gamification — streaks, confetti, completion percentages, celebratory toasts. State changes are observed, not announced.
- **Don't** introduce a second typeface. Hanken Grotesk does the whole job.
- **Don't** use `#000` or `#fff` for text. The pure-black/pure-white pair is the visual signature of nothing in particular; this system has a temperature.
- **Don't** use `border-left` greater than 1px as a colored stripe on cards or alerts. It is never the right answer.
- **Don't** combine `background-clip: text` with a gradient. Gradient text is forbidden. Emphasis comes from weight or size.
- **Don't** nest cards inside cards. The Flat-by-Default rule applies recursively.
- **Don't** use uppercase outside the 11px status eyebrow. Not on buttons, not on headings, not for emphasis.
- **Don't** introduce a sixth color. The five named tokens (Daybreak Cream, Hearth Ink, Moss, Solar Amber, Coastal Blue) are the entire system. If a new column or status appears, it gets a label and reuses the existing palette.
- **Don't** animate layout properties (width, height, top, margin). Transform and opacity only, ease-out.
- **Don't** use modals for anything that could be inline. The dialog is the single shadowed surface in the system; it costs attention to open.
