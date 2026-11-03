# Design — menu module

**Status:** implemented in this pass. **Scope:** meal periods, groups, dishes,
photography limits. **Not in scope:** recipe costing, prep sheets, availability.

## Problem

Caterers describe their offering in meal periods ("breakfast", "lunch", "high tea"),
and inside each period in groups ("South Indian hot", "live counters"). A flat dish list
loses the structure the customer actually reads, and a package-only model cannot express
"pick two from each group".

## Model

Three levels, one of which already existed:

| Level | Table | Purpose |
|---|---|---|
| Meal period | `menu_sections` | name, service window (`07:00`–`10:30`), sort order |
| Group | `menu_groups` | name, note, belongs to one section |
| Dish | `service_items` | the existing priced row, now with `section_id`, `group_id`, `description`, `dietary`, `image_bytes` |

The dish stays in `service_items` on purpose: quoting reads that table, so a dish is
created once and is immediately quotable. The menu hierarchy is presentation and never
enters `lib/domain/pricing.ts`.

`section_id` and `group_id` are nullable. A dish can exist without a meal period (legacy
catalogue rows), and deleting a period sets them null rather than deleting the dish.

## Display

Two readings of the same data, both server-rendered:

- **Grouped** — one card per group inside each meal period, with the service window in the
  section header. This is how the caterer presents it.
- **Full list** — a single table across all periods: meal, group, dish, diet, price. This is
  how the owner checks consistency.

The toggle is a query parameter (`?view=list`), so both views are linkable and cacheable;
no client state, no hydration cost.

## Images and storage rules

Enforced server-side in `lib/storage/menu-images.ts`:

| Rule | Value | Why |
|---|---|---|
| Max bytes per image | 200 KB | A phone photo is 4–8 MB; two of those blow a mobile page |
| Accepted types | WebP, JPEG, PNG | No SVG (scriptable), no HEIC (browser support) |
| Per-business quota | 25 MB | Keeps the free Supabase bucket usable for years |
| Object path | `<org_id>/<uuid>.<ext>` | Tenant-namespaced; a leaked path is useless elsewhere |
| Cache | `31536000` | Content-addressed by UUID, so immutable is safe |

Rejections return a reason code (`image_type`, `image_size`, `image_quota`,
`image_storage`) that the page explains. Upload is refused outright when
`SUPABASE_SERVICE_ROLE_KEY` is absent, rather than silently dropping the file.

**Known gap:** deleting a dish does not delete its object, so quota is only reclaimed by a
future cleanup job. Documented in the handoff.

## Tenancy

`menu_sections` and `menu_groups` carry `org_id`; `service_items` already did. Policies:
every active member may read, only `owner`/`manager` may write. Added to
`db/policies.sql`.

## Verification

- `npm run typecheck`, `npm run test`, `npm run build`.
- Demo board renders with four meal periods; grouped and list views both return 200.
- Image rules are unit-testable pure functions; upload itself needs a live bucket.

## Next

Sessions (`event_sessions`) so one booking can hold lunch and dinner, then a prep sheet
derived from the sent quotation version — see `docs/11-competitive-analysis-and-gaps.md`.
