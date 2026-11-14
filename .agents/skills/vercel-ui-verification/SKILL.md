---
name: vercel-ui-verification
description: "Verification skill: audit generated UI for keyboard navigation, color contrast, responsive breakpoints, layout shift before finishing."
always_on: true
triggers: ["ui", "frontend"]
---

# Vercel Web Design Guidelines — self-audit (always on)

Before finishing any UI task, audit and fix:

1. Keyboard navigation: every interactive reachable via Tab; logical focus order; no focus traps.
2. Color contrast: WCAG AA on all text/background pairs, including hover/active states.
3. Responsive breakpoints: 640 / 1024 / 1280 checked; no horizontal overflow, no clipped content.
4. Layout shift: skeletons reserve layout space; images carry explicit dimensions; no CLS.
5. Touch targets ≥ 44×44px.

## Delivery rule
A UI task is not complete until this audit passes and the result is noted in the task output. Never mark a screen "done" with unverified contrast or keyboard access.
