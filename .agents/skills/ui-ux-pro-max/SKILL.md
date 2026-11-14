---
name: ui-ux-pro-max
description: "Design intelligence database: matches app type to 67 UI styles, 96 color palettes, 56 font pairings, 100 UX rules and generates a complete design system before code."
always_on: true
triggers: ["ui", "frontend", "design-system"]
---

# /ui-ux-pro-max — design-system generator (always on)

## Before any UI code
Match the app type (multi-vertical event-services quotations; catering / decor / photography verticals) against the design database and lock a design system first:

1. UI style: editorial event-services — clean, whitespace-led, high-trust — chosen from 67 styles.
2. Color palette: one of 96 palettes; produces surface / primary / inverse / error / success / muted tokens.
3. Font pairing: one of 56 pairings; heading + body, clamped fluid type scale.
4. UX rules: apply the rules relevant to quotes / forms / calendars — min-quantity enforcement, server-verified totals, manual bank/UPI payment instructions visible on the public quote, no pay-now buttons.

## Output
`lib/design-tokens.ts` (and Tailwind layer) with the locked palette, spacing, type scale, plus the selected style / palette / pairing IDs so the choice is reproducible and reviewable.

## Rule
Never ship a component whose tokens were not chosen by this step. UI mirrors the money rules: client totals are previews only; the server recomputes and stores. No fake "discount" badges or "LIVE" storefront claims the product does not implement.
