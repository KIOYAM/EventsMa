# Storefront driven by adopted services

**Date:** 16 November 2026
**Status:** implemented (storefront slice); backlog audit below
**Touches:** `lib/db/public.ts`, `app/p/[slug]/page.tsx`, `lib/domain/plural.ts`

## 1. What this answers

Two questions were asked together: what is actually left in the backlog, and why
does the public storefront not reflect the multi-service product we already built.

Short version: `getPublicProfile` already filtered services to
`business_services.enabled = true`, so an unadopted service never *listed*. But the
page showed a count per service and nothing else — a visitor to Kannan Events read
"Priced by 3 unit types - 0 dishs in the catalogue". The multi-service catalogue
(`service_items` with `vertical_key`) never reached the customer-facing page, and
the count copy carried a pluralisation bug on a live URL.

## 2. Backlog audit — `next-build-handoff.md` against the tree

Evidence is a route, a table, or a grep — not a memory of a design doc.

| Gap | Claimed in handoff | Actual state 16 Nov | Evidence |
|---|---|---|---|
| G1 public-path tenancy | open | **done** | `lib/db/public-token-isolation.integration.test.ts`, 9 tests live |
| G2 submission → quotation | open | **done** | `getSubmissionPrefill` in `lib/db/queries.ts`, used by `quotes/new` |
| G3 abuse control | open | **done** | `lib/security/rate-limit.ts`, `db/migrations/0010_rate_limits.sql`, honeypot on `/p/[slug]` and `/api/share/[slug]/submit` |
| G9 portfolio photos | open | **done** | `lib/storage/portfolio-images.ts`, `components/portfolio/photo-upload.tsx` |
| G4 run-of-show | open | **partial** | `events/[id]/_components/operations-tab.tsx` exists; no org-wide audit viewer (`audit` rows are written, nothing reads them) |
| G5 client merge | open | **open** | no `merge` anywhere in `app/` or `lib/` |
| G6 transport, rentals, requirements | open | **open** | only `lib/domain/ops.ts` types and demo fixtures; no event columns |
| G7 recipes → stock | open | **open** | no purchase list, no shortfall, no recipe cost query |
| G8 rota, leave, check-in | open | **open** | `/me` only lists assignments |
| G10 export / import / restore drill | open | **open** | no export route or action |
| G11 credit notes | open | **open** | no `credit_note` in schema or code |
| G12 storefront reviews + map | open | **open** | nothing; `reviews` appears only as a copy string |
| G13 admin actions | open | **open** | `/admin` is read-only, no suspend |
| G14 commercial layer | open | **open** | no billing ADR |

So the remaining queue is G4 (audit viewer half), G5, G6, G7, G8, G10–G14. The
handoff's §2 intro still reads as if G1–G3 are untouched, which is the most
misleading thing in `docs/` right now — an agent reading it would rebuild G1.

## 3. Stale modules found

1. **`docs/designs/next-build-handoff.md` itself.** Its "do not rebuild" table and
   its ranked-gap table disagree with the tree on G1, G2, G3 and G9, and its quality
   gate line still says "46 tests". A status note is now appended to §2.
2. **The public storefront** (`app/p/[slug]/page.tsx`). Presented each service as
   `N items` in a badge and `Priced by N unit types - N dishs in the catalogue` in a
   card. "Priced by N unit types" is internal pricing jargon shown to customers,
   `dish` + `s` produced "dishs" on a live page, and the catalogue itself — the whole
   point of verticals 0004–0005 — was invisible.
3. **The owner storefront screen** (`app/(app)/storefront/page.tsx`) promises "Your
   name, city, service areas and published work on one link", but `getPublicProfile`
   selects name, tagline, city and phone only: the public page shows no service
   areas, no brand colour, and no link mentions `/services`. Either the copy or the
   page is wrong; this note records the gap rather than silently rewriting the screen.
4. **`app/(app)/services/page.tsx`** renders an empty `void fetch(...).then(reload)`
   submit handler inside a form whose action is a server action — the `onSubmit`
   handler prevents default and posts a `FormData` to the action URL by hand. It
   works, but it is the only place in the app that does this, and it bypasses the
   progressive-enhancement path every other form uses. Not changed here.

## 4. The storefront change

**Rule enforced:** a service appears on `/p/[slug]` only if the workspace adopted it
(`business_services.enabled = true`), and its catalogue items are only loaded when it
did. Items for a vertical the workspace never enabled are not fetched at all, so they
cannot leak into the response by an accidental join.

Shape:

```ts
PublicService = {
  verticalKey, label,
  itemNoun,            // "dish" — the page pluralises, the descriptor stays singular
  itemCount,
  items: { id, name, unit }[]   // first 8 by sortOrder then name
}
```

- `unit` is the owner's free-text `unitLabel` when set ("per plate"), otherwise the
  unit-class label ("Per guest").
- No prices. The page still says prices are confirmed in a written quotation; a
  catalogue preview that contradicts that sentence would be a marketing claim the
  quotation is free to deny.
- Items are ordered by `sort_order, name`; the query is scoped by `org_id` **and**
  `vertical_key IN (adopted)` **and** `active = true`.

`pluralise(noun, count)` lives in `lib/domain/plural.ts` — sibilants take `es`
("dishes"), consonant + `y` becomes `ies`, everything else adds `s`.

## 5. Verification

- `npx tsc --noEmit` — clean.
- `npx vitest run` — unit suite plus `lib/domain/plural.test.ts`.
- `TENANCY_LIVE_TEST=1 npx vitest run lib/db/public-token-isolation.integration.test.ts`
  — the new case seeds tenant A with a decor item while A adopts catering only, and
  asserts `services` is `['catering']` and the item list is exactly A's dish.
- `npm run i18n:audit` — 481 → 481 candidates, unchanged. The sentence that was
  removed ("Priced by N unit types") was never a countable JSX literal because it is
  interrupted by expressions, and the new item rows are data rather than copy. No new
  inline string was introduced, so the backlog neither grew nor shrank.
- Live page on the dev server with the Kannan Events workspace.

## 6. Deliberately out of scope

Reviews (G12), a map, prices on the storefront, the owner-preview/service-areas
mismatch, and the `services` page's hand-rolled fetch. Each is a separate slice.
