# JobNess — Agent Guide

## Design Context

This repo carries strategic and visual context in two root files. Read them before designing or editing UI.

- **[PRODUCT.md](PRODUCT.md)** — register, users, brand personality, anti-references, design principles.
- **[DESIGN.md](DESIGN.md)** — palette, typography, elevation, components, do's and don'ts. Sidecar at [DESIGN.json](DESIGN.json).

Register: **product** (single-user app, password-gated; design serves the product).

### Design principles (operating creed)

1. **Operator first, always** — Nessim built this for himself. Decoration earns its place by making the tool quieter or faster.
2. **Quiet is a feature** — no streaks, badges, celebratory toasts, or engagement loops. State changes are observed, not announced.
3. **Trust the typography** — Hanken Grotesk + Source Serif 4 carry hierarchy. Tabular numerics on every countable.
4. **Restraint over completeness** — fewer things, better. If a feature doesn't change a swipe decision, it doesn't belong.
5. **Paper, not phosphor** — warm cream surface (`#faf7f0`), warm near-black ink (`#1a1815`). Earth-tone accents (moss / solar amber / coastal blue) mark category, never decorate.

### Anti-references (never drift toward)

- LinkedIn / Indeed style — busy, ad-laden, recruiter-shaped, social-network noise.
- Crypto / fintech-bro neon dark mode — glow, gradients, hero-metric template.
- Generic SaaS dashboards — purple gradients, identical card grids, AI-slop polish.
- Productivity gamification — streaks, confetti, completion meters.

### Visual non-negotiables

- No `#000`, no `#fff` for text — the system has a temperature.
- No gradient text. No `border-left > 1px` as a colored stripe. No nested cards.
- Source Serif 4 only on entity names (product mark, company names). Never body text.
- Uppercase only on the 11px status eyebrow with letter-spacing 0.05em.
- Surfaces flat by default — borders, not shadows, do the work. The modal panel is the only surface that gets a real shadow.
- `prefers-reduced-motion: reduce` is respected; only opacity/transform animate; never layout properties.

For deeper context (named rules, component specs, tonal ramps) read DESIGN.md and DESIGN.json directly.
