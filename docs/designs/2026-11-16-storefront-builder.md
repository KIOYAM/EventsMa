# Storefront section engine

**Date:** 16 November 2026
**Status:** shipped (first slice)
**Migration:** `db/migrations/0011_storefront_sections.sql`

## 1. What this is

Before this change `/p/[slug]` was a fixed template: hero, services, work, form,
always in that order, with copy only the code could change. This slice turns the
page into **data**: each workspace owns an ordered list of sections it can reorder,
hide, retitle, and give one hero photograph.

Deliberately *not* a drag-and-drop page builder. The product is a quotation tool
for event businesses, not a website builder; a section list covers the real need
("show my photos above the form", "hide services until the menu is ready") without
a canvas, a component palette, or arbitrary HTML nobody can staff.

## 2. Data model

`public.storefront_sections` — one row per section a tenant has customised.

| column | meaning |
|---|---|
| `org_id` | tenant key, `NOT NULL REFERENCES organisations ON DELETE CASCADE` |
| `key` | `hero` · `services` · `gallery` · `enquiry` |
| `position` | the owner's order |
| `visible` | rendered or not |
| `heading` | optional override; `NULL` keeps the shipped wording |
| `image_path` | hero photograph, private bucket, signed on read |

`unique (org_id, key)` makes a double submit idempotent. RLS is enabled with the
same shape as every other operational table: `SELECT` for any member,
`ALL` for owner/manager (`db/policies.sql`, plus the same policies inline in the
migration so a database built from SQL alone is correct).

**Rows are optional by design.** A key with no row falls back to canonical order
and page copy in `lib/domain/storefront.ts`. That is why the feature could ship to
a live storefront without a backfill: a workspace that never opens the builder
renders exactly the page it had.

## 3. Engine

```
lib/domain/storefront.ts   pure: keys, labels, orderSections, visibleSections
lib/db/storefront.ts       server: read, ensure, move, toggle, set heading/image, reset
app/(app)/storefront/actions.ts   six server actions, workspace resolved server-side
components/storefront/section-builder.tsx   the owner UI, zero client JS
app/p/[slug]/page.tsx      renders the stored order
```

- `ensureStorefrontSections` materialises missing keys on first write, appended
  after existing rows, so ordering is stable across deploys that add a section type.
- `moveStorefrontSection` swaps two `position` values. No unique constraint on
  position, so a swap cannot collide; the read path sorts by `position, key`.
- Every write goes through `getDb()` inside `withWorkspace`, so RLS applies to the
  builder exactly as it does to the rest of the workspace.
- Hiding every section cannot blank the page: the public render falls back to the
  hero block.

## 4. Design decisions (impeccable-ui / ui-ux-pro-max)

- **Tokens only.** Forest/mint/paper/canvas/ink/hairline from the existing theme;
  no new colour, no raw hex. Radius via `rounded-control` / `rounded-card`.
- **8px grid, 44px targets.** Every builder control is `h-11` (44px); icon buttons
  are `h-11 w-11` so they pass on a phone.
- **Two type roles.** `font-display` (serif) for the customer-facing name only;
  workspace headings stay sans, per the "Quiet ledger" direction.
- **Motion is CSS, not GSAP.** The `motion-gsap` skill asks for GSAP; AGENTS.md
  forbids a dependency without a documented cost reason, and this is four
  fade-ups. `.reveal` uses `cubic-bezier(0.23, 1, 0.32, 1)`, 320ms, 70ms stagger
  applied as an inline `animation-delay`; `.lift` is a 2px hover translate at
  240ms. `prefers-reduced-motion` disables both (skill: never slower than 500ms,
  respect reduced motion).
- **Reordering is buttons, not drag.** Keyboard-operable, works without JS, and
  survives the 10s browser-evaluation cap the localization guide warns about.

## 5. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npx next build` | 0 |
| `node db/setup.mjs` | migrations applied; 61 tables, 61 with RLS, 118 policies; two-tenant isolation PASS |
| live schema | `storefront_sections` RLS on, policies `storefront_sections_select` (SELECT) and `_write` (ALL), unique index present |
| end-to-end render | temporary published tenant seeded with `gallery, services, hero` and `enquiry` hidden: section offsets 2395 < 2877 < 4013, heading override rendered, hidden section absent from the HTML, dish chip and portfolio entry present, `.reveal` wrapper applied — 9/9 assertions |
| cleanup | temporary organisation deleted, `storefront_sections` back to 0 rows, 2 real organisations |
| design check | three temporary tenants, one per theme, each with its own brand colour: all three returned 200 with **distinct hero markup**, the tenant colour in `--brand`, the derived `--brand-ink` on the button, the catalogue and the `.reveal` wrapper — 8/8 assertions |
| `npx vitest run` | see report |

Not verified: the owner builder and the theme picker were not clicked through in a
browser (no signed-in session was used); they compile, build, and every control is a
plain form posting to an action whose effect was verified through the rendered
public page instead.

## 6. Migration note for the next agent

`drizzle-kit generate` produced a migration that re-created the 0005 service
tables and `quotations.submission_id` because `db/migrations/meta/` only holds
snapshots for 0002 and 0004. Running it against the live database would fail on
the first `CREATE TYPE`. The shipped 0011 file is hand-written and contains only
`storefront_sections`. **Do not regenerate 0012 without restoring the missing
snapshots first**, or the same drift will be re-emitted.

## 7. The designs themselves

The first slice made sections orderable but every storefront still looked
identical: the tenant's `brandPrimary` was collected in Settings and then ignored
by `/p/[slug]`. Three presets now change the *layout*, while the tenant's own
colour carries through.

| Theme | Hero | Catalogue | Rhythm |
|---|---|---|---|
| **Editorial** | card, photo above, 5xl serif name, wide margins | two-up cards with chips | generous, 40px between sections |
| **Ledger** | no card, ruled top and bottom, tight serif | ruled rows, name left / count right | dense, 32px, hairline rules |
| **Gallery** | full-bleed photo with a forest scrim and white type | two-up cards | medium, image-led |

- The choice is stored in `businesses.settings.brand.theme` beside the colour, so
  one settings write serves the whole public surface and no column is needed for
  an enum. `resolveStorefrontTheme` falls back to Editorial for unknown values, so
  a bad row cannot break a live page.
- `--brand` is set on the wrapper from tenant data. `--brand-ink` is derived with
  `color-mix` toward the night token so a pale brand colour still carries white
  button text; without `color-mix` it falls back to forest.
- The accent appears as a short rule above each section heading and on the enquiry
  button — enough to read as "their" page without letting a brand colour repaint a
  whole palette that was not contrast-checked for it.

## 8. Deliberately out of scope

Drag-and-drop, arbitrary HTML blocks, per-section background colours, multiple
gallery images per section, section duplication, and a publish-preview diff. Each
is a later slice; the section list is the floor the rest can build on.
