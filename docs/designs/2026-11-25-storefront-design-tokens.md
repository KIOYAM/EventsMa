# Storefront design tokens (v6)

Status: implemented. Extends `2026-11-17-production-storefront.md`.

## Problem

The studio let an owner pick a theme, one brand colour, a font and the section
order. Every tenant still shared the same corner radius, section rhythm, hero
height, button wording, and had no place for a second accent or for channels
other than a phone number. Two Nilgiris businesses with different price points
ended up looking like the same template with a different green.

## What is stored

`businesses.settings.design`, resolved by `lib/domain/storefront-design.ts`:

| Field | Values | Default |
| --- | --- | --- |
| `accent` | `#rrggbb` or absent | theme accent (gold; terracotta on ledger) |
| `surface` | `theme` / `canvas` / `paper` | `theme` |
| `corners` | `sharp` / `soft` / `round` | `soft` (1rem, the shipped value) |
| `spacing` | `compact` / `regular` / `airy` | `regular` (theme's own) |
| `heroHeight` | `short` / `medium` / `tall` | `medium` (theme's own) |
| `ctaLabel` | ≤ 40 chars | the shipped "Ask for a quote" |
| `announcement` | ≤ 120 chars | none |
| `whatsapp` | 10–15 digits, country code | none |
| `instagram` | handle, 2–30 `[a-z0-9._]` | none |
| `email` | valid address, ≤ 120 | none |

A pasted `https://instagram.com/x/?hl=en` becomes `x`; a pasted `+91 98431 55210`
becomes `919843155210`. Anything unparseable is dropped rather than stored, so the
renderer never has to guess.

## Versioning

Snapshot schema **6** adds `design`. `parseStorefrontSnapshot` accepts 1–6 and
resolves a missing design to the shipped defaults, so a v5 page renders exactly as
it did before this change. `snapshotFingerprint` includes the design, which is what
makes a design-only edit show as unpublished work in the publish panel.

Defaults are chosen to reproduce the old appearance, not to be "neutral": `regular`
returns no spacing class at all, `medium` leaves the theme's own hero height, `soft`
is the existing `--radius-card`, and a null accent uses the theme's shipped overline
colour. That is why enabling this changes nothing until an owner chooses something.

## Rendering

The page wrapper sets `--brand-accent` and `--radius-card`. Overline text reads
`var(--brand-accent, <theme fallback>)`, so cards and labels follow the choice
without touching every section. `spacing` and `heroHeight` are only applied when
chosen (`!py-10`/`!py-24`, inline `min-height`), which keeps the theme's responsive
padding until someone overrides it. Contact channels render in the contact band and
the footer; the band now shows if there is any channel even when `phone` is empty.

## Files

- `lib/domain/storefront-design.ts` — types, defaults, sanitisers, CSS/mapping helpers
- `lib/domain/storefront-snapshot.ts` — v6, parse/build/fingerprint
- `lib/db/storefront.ts` — `getStorefrontDesign`, `setStorefrontDesign` (one read-modify-write of `settings`)
- `app/(app)/storefront/actions.ts` — `saveDesign`
- `components/storefront/design-form.tsx` — the studio card
- `components/storefront/public-page.tsx`, `public-sections.tsx` — apply tokens
- `lib/i18n/messages/{en,ta}/storefront.ts` — labels, both locales

## Checks

- `npx vitest run lib/domain/storefront-design.test.ts lib/domain/storefront-snapshot.test.ts` — 21 passed, including v5 → defaults and design-in-fingerprint.
- `npm run typecheck` — 0 errors.
- `npm run i18n:audit` — 0 exit, no untranslated string added.
- `/p/tinu-eventer` renders the announcement, "Check your date", `--brand-accent:#a4552b`, `--radius-card:1rem`, `min-height:38rem` and `wa.me/919361490331`; published snapshot is schema 6.

## Known limits

- The theme's hard-coded band and hero art keep their own shapes; the tokens change
  radius, rhythm, height and accent, not the layout itself.
- Only one accent is exposed. A full multi-colour palette would need a token editor
  and a contrast check per tenant; not attempted here.
- Contact channels are informational links. They do not feed the enquiry form or
  the CRM, so a WhatsApp conversation is not recorded as an enquiry.
