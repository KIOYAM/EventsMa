# Design — Configurable catering engine

**Status:** slices 1–3 shipped (schema and engines, configuration screen, nav gate,
event catering panel, recipe builder, kitchen production sheet)
**Owner:** product + engineering
**Supersedes:** nothing. Extends [04](../04-architecture-cost-and-scale.md) and [12](../12-prototype-page-parity.md).
**Rule this document protects:** the application does not decide how a catering business
operates. Sessions, categories, selection limits, dietary labels and pricing bases are the
owner's configuration, stored as data.

## 1. Problem

The prototype hardcodes catering: three cuisines, ten categories, "Breakfast / Lunch /
Dinner", one guest count per event. Real caterers differ — a temple kitchen serves breakfast
and lunch only; a wedding venue serves welcome drinks, breakfast, snacks, lunch, evening
snacks and dinner, each with its own guest count. Any hardcoded list is wrong for most of
them, so the module is an engine, not a menu form.

## 2. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | Sessions, categories, dietary labels, selection rules are **rows**, not enums | the owner renames and reorders without a deployment |
| D2 | Selection rules live in `category_selection_rules`, keyed by session + category | the same category can have different limits in breakfast and dinner |
| D3 | Guest count is per **event session**, never per event | 500 at lunch and 300 at dinner is normal |
| D4 | A session stores a **snapshot** of each selected line (name, unit, price) | editing the catalogue must not rewrite a confirmed booking |
| D5 | Individual guest selection ships as **dietary counts per session** first | a caterer needs "120 veg, 40 non-veg, 15 Jain" before it needs 500 names; names are P1 |
| D6 | Recipes are `menu_item_ingredients` with milli-units and a wastage basis | integer arithmetic like money; kg/L/gram conversions stay exact |
| D7 | Three engines are generic: session, category, selection rule | photography packages and decor packages reuse them unchanged |
| D8 | Everything is org-scoped, RLS on every new table | non-negotiable #1 in AGENTS.md |

## 3. Data model

Ten tables, all with `org_id` and RLS:

- `catering_sessions` — the owner's session templates (name, times, min/max guests, cut-off, order, active).
- `menu_categories` — owner-defined categories ("Welcome drinks", "Live counters", not an enum).
- `dietary_profiles` — veg / non-veg / vegan / Jain / allergies, each with `is_allergen`.
- `category_selection_rules` — per session + category: min, max (null = unlimited), required, substitutions, custom requests, pricing basis.
- `menu_item_categories` — many-to-many, so one dish can sit in "Starters" and "Live counters".
- `event_catering_sessions` — the instance on an event: date, times, guest count, service style, status.
- `session_menu_items` — selected lines with name/unit/price snapshots and quantity.
- `session_dietary_counts` — per-session counts by dietary profile key.
- `menu_item_ingredients` — recipe rows: ingredient, quantity per serving (milli), unit, wastage basis points.
- `catering_snapshots` — immutable JSONB capture of a session set at send/confirm time.

Money stays integer paise. Ingredient quantities are milligram/millilitre/piece-thousandths.

## 4. Engines (`lib/domain/catering.ts`, pure)

1. `validateSelection(rule, count)` → below minimum, above maximum, or required-and-empty. No UI needed; the server calls it before writing.
2. `lineAmountPaise(line, guests)` → per-guest/per-plate uses `guests`, every other base uses the quantity alone.
3. `sessionTotals(lines, guests)` → subtotal, tax, total, per line.
4. `eventCateringTotals(sessions)` → one number over differently-sized sessions.
5. `aggregateIngredients(rows)` → `perServing × servings × (1 + wastage)`, merged by ingredient + unit.

Pure functions, no database, so the rules are falsifiable by unit tests before any screen exists.

## 5. Surface

- `/catering` — owner configuration: sessions, categories, dietary labels, selection rules matrix, adopt-catering card.
- `/events/[id]` gains a catering panel: add sessions, set guest counts, pick dishes within the configured limits, see dietary counts and the session total.
- `/catering/production` — aggregated ingredient demand for an event (needs recipes entered).
- Nav: `Menu`, `Packages`, `Catering` appear only when the catering vertical is enabled.

## 6. Validation (server, not only client)

- Session name unique per org; times `HH:MM`; `max >= min`; guests inside the session's own bounds.
- Selection count checked against the stored rule on every write, including after a rule change.
- A line's item must belong to the org and to a category enabled for that session.
- Recipe units must match the inventory unit class; wastage 0–5000 bp.
- Quote and invoice totals are recalculated on the server; the browser's arithmetic is a preview.

## 7. Migration and safety

Forward-only Drizzle migration. New tables only — nothing is rewritten, so the deploy is
reversible by reverting the release while leaving the tables in place. RLS is appended to
`db/policies.sql`; `node db/setup.mjs` applies and re-checks coverage. The two-tenant test
must include one new catering table.

## 8. Testing

Unit: selection boundaries (zero, minimum, maximum, unlimited), per-guest vs per-tray
pricing with differing guest counts, tax, ingredient aggregation with wastage, snapshot
round-trip. Integration: two orgs cannot read each other's sessions or rules. Manual: adopt
catering on a throwaway tenant, create two sessions, confirm the nav gate appears and a
second tenant with catering disabled sees no Menu link.

## 9. Build order

| Slice | Contents | State |
|---|---|---|
| 1 | Schema, RLS, engines, tests, `/catering` configuration, nav gate | **shipped** — 10 tables, 20 RLS policies, 17 unit tests, verified against the live database |
| 2 | Event catering panel: multi-session, guest counts, dish selection against rules | **shipped** — `/events/[id]/catering`; sessions copied from templates or typed as one-offs, per-session guest counts, server-side rule re-check, dietary counts, snapshot on confirm |
| 3 | Recipe builder + production sheet + inventory demand | **shipped (demand only)** — `/catering/recipes` and the production sheet on the event page; inventory is still a read-only demand number, nothing writes stock |
| 4 | Snapshots on quote send, revision approval | after 2 |
| 5 | Individual guest selection by name, segment pricing | after 4 |
| 6 | Staff and equipment ratios, session profitability | after 3 |

## 10. Risks

- **Config sprawl.** Four screens of configuration can overwhelm a 20-guest caterer. Mitigation: seed a working default set on adoption; every list starts with three rows, not zero.
- **Snapshot drift.** A session copied at quote time diverges from the live menu by design; the UI must label a snapshot as such rather than showing it as editable.
- **Rule change after selection.** Rules can tighten after dishes are chosen; the check runs on read as well as on write and surfaces "this session no longer matches its rules".
- **Demand without consumption.** The production sheet multiplies recipes by session guest counts and shows wastage, but no stock is decremented and no purchase order is raised. Calling that "inventory management" would overstate the build.
