---
name: ui-skills-collection
description: "Modular baseline rulesets (frontend-design, improve-ui, improve-react): hard boundaries on spacing, accessibility, component structure."
always_on: true
---

# ui-skills-collection — baseline boundaries

## frontend-design
- 8px spacing grid; no magic numbers.
- Max content width 1200px; centered containers.
- Responsive breakpoints: 640 / 1024 / 1280 px.

## improve-ui
- WCAG AA contrast (4.5:1 normal text, 3:1 large text), including hover/active states.
- Every interactive element: visible focus, ≥ 44×44px touch target, clear hover/active states.
- Form fields: visible labels, error text associated via ARIA, never placeholder-as-label.

## improve-react
- One responsibility per component; props typed where data crosses the server boundary.
- No client-computed money totals; server recomputes, client previews only.
- No chart library, no table library, no URL-state library in the client bundle (AGENTS.md §5).

## Must not
- Stiff transitions, generic dashboard templates, inline styles that bypass tokens, client-side "final" totals.
