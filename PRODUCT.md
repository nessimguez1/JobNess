---
name: JobNess product context
description: Strategic register, users, purpose, personality, anti-references, and design principles for JobNess
type: project
---

# Product

## Register

product

## Users

Single user: **Nessim Guez**, 26, based in Tel Aviv, currently a Relationship Manager at UBP (Union Bancaire Privée). Multilingual (FR native, EN fluent, HE professional), targeting Private Banking RM roles at tier-1 Swiss banks, fintech BD/partnerships, and VC platform roles in Israel and remote EU/US.

**Context of use:** Discreetly checked from his desk during a workday at his current role, plus a longer session in the evening. The app must load fast, never page him with notifications, and never look like a job-hunting site to a passing colleague. Daily ritual: triage scraped listings, swipe into Inbox / Interested / Applied / Archive, draft outreach, manage target companies.

**Job to be done:** Replace the noisy, ad-laden job-board feedback loop (LinkedIn, Indeed, Drushim) with a calm private terminal that does the searching, scoring, and drafting for him, then gets out of the way. He is not browsing; he is operating.

## Product Purpose

A private, password-gated job-hunt terminal. A scraper pulls from career pages, Drushim, and (when cookied) LinkedIn twice a day. Claude scores each listing against Nessim's profile and writes a fit note. The web app presents everything in a Kanban-shaped queue with one-keystroke swipes, an outreach drafter, a target-companies tracker, and a settings pane.

Success looks like: Nessim opens it daily, the top of the queue is signal, the bottom is filtered noise, and he ends most sessions with one decision made and at least one outreach draft sent. The interface should feel like an extension of his discipline, not a distraction from it.

## Brand Personality

**Modern minimal, quiet, professional.** Lineage: Things 3 and Reeder — calm productivity, single-user reverence, generous typography, deliberate restraint. The paper-and-ink visual identity (warm off-white surface, ink-near-black type, earth-tone accents) is a quiet rejection of generic SaaS, not a maximalist editorial statement.

Voice: direct, low-stakes, never gamified. Microcopy should sound like a notebook talking to its owner, not a product onboarding a user. No encouragement language, no streaks, no badges, no celebratory toasts. A score of 92 is shown; it is not announced.

## Anti-references

- **LinkedIn / Indeed style.** Busy, ad-laden, recruiter-shaped UX, social-network noise, "people you may know," skill endorsements, premium upsells. JobNess is the antidote: no engagement bait, no algorithm guessing what he wants next, no notifications.
- **Crypto / fintech-bro neon dark mode.** Glow effects, animated gradients, big-number-small-label hero metrics, neon-on-black palette. JobNess is paper, not phosphor.
- **Generic SaaS dashboard.** Identical card grids, gradient text, purple accents, AI-slop polish. JobNess earns its visual character from typography and palette, not from chrome.
- **Productivity gamification.** Kanban apps with confetti, dopamine triggers, completion percentages. JobNess respects that this is a serious, sometimes anxious activity; it does not make it feel like a game.

## Design Principles

1. **Operator first, always.** Nessim built this for himself. Every choice — keyboard-first navigation (`g`+`f/c/o/s`, `?` for shortcuts), tab semantics, density, the absence of any marketing copy — should feel like a tool a serious operator made for his own use. Decoration only earns a place if it makes the tool quieter or faster.

2. **Quiet is a feature.** The rest of his job-hunting day is loud — recruiter spam, LinkedIn ads, anxiety. JobNess should feel like opening a clean notebook. No streaks, no progress meters, no engagement loops, no celebratory animations. State changes are observed, not announced.

3. **Trust the typography.** Hanken Grotesk and Source Serif 4 carry the hierarchy. Scale and weight contrast do the work; chrome, color, and shadow do not. Tabular numerics on everything countable (scores, salaries, dates). The serif is reserved for the brand mark and display moments — never body.

4. **Restraint over completeness.** Fewer things, better. The Kanban columns, the score, the fit note, the outreach draft — that is the whole game. Resist the urge to add charts, graphs, secondary metrics, or "insights." If a feature does not change a swipe decision, it does not belong.

5. **Paper, not phosphor.** The warm off-white surface (`--paper`) and ink-near-black text (`--ink`) are the identity. Earth-tone accents — forest, brick, steel — appear sparingly to mark category or column, never to "pop" or to grab attention. Never neon, never gradient text, never glow, never dark mode by default.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as a baseline. Single-user app, but Nessim works long sessions and the visual system should remain comfortable across them.
- **Reduced motion** already respected via `prefers-reduced-motion: reduce` in globals.css. Keep it that way: any new animation must check the same media query or use a transform/opacity-only ease-out.
- **Keyboard parity.** Every action that has a button must have a keyboard equivalent. The existing `g`-prefix tab jump and `?` shortcut overlay set the bar; new features inherit it.
- **Color is never the only signal.** Earth-tone accents (forest/brick/steel) mark category, but every category also carries a label or icon. Score color must not be the only score indicator.
- **Multilingual data, English UI.** Job titles and descriptions arrive in EN/FR/HE; the interface stays in English. Right-to-left support is not a requirement (Nessim reads HE but operates in EN).
