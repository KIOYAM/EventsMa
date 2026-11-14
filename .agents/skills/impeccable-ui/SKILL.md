---
name: impeccable-ui
description: "Strict design vocabulary for agents: layout hierarchy, design tokens, anti-pattern blocking via /craft, /polish, /typeset, /arrange, /audit."
always_on: true
triggers: ["ui", "frontend", "component", "design", "layout"]
---

# /impeccable-ui — design-system playbook (always on)

## When it loads
Every front-end / UI / component prompt loads this playbook before any code is written. It replaces generic AI layouts with a structured architecture: design tokens first, then layout, then components.

## Design tokens (single source of truth)
- Spacing: 8px grid — 4, 8, 12, 16, 24, 32, 48, 64px. No arbitrary px values.
- Color: semantic palette from ui-ux-pro-max — surface / primary / inverse / error / success / muted.
- Typography: clamped fluid scale, max two font pairings, 1.5 line-height body.
- Radius: 8px default, 12px cards, 4px inputs.
- Shadows: two levels only (sm, md); no blur above 24px.

## Commands
/craft     — page skeleton: shell → landmarks → grid → content; reserve layout space (no CLS)
/polish    — refine a component: spacing, contrast, touch targets ≥ 44×44px
/typeset   — typographic scale: heading levels, body, caption, code
/arrange   — layout: flex vs grid, gutters, breakpoints at 640 / 1024 / 1280
/audit     — anti-pattern scan: blocks !important, magic numbers, absolute-position layouts, unstyled form controls, generic "SaaS" templates

## Hard rules
1. Tokens before values: every spacing/color/typography value references a token.
2. No zero-config layouts: always define columns/gutters/breakpoints explicitly.
3. Accessibility by default: WCAG AA contrast, visible focus states, ARIA labels on interactive SVG.
4. No generic templates: landing/creative pages use Taste & Hallmark instead.
5. No writes outside D:\Kannan-Projects\EventsMa (caches, secrets, artifacts all stay on D:).

## Output
Component code + token map + /audit pass note attached to every UI task.
