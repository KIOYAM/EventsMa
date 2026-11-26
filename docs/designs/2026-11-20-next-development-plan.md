# Next development plan — from "deployed" to "provably working"

**Date:** 20 November 2026 · **Owner:** whoever picks this up · **Status:** draft
**Related:** [`next-build-handoff.md`](next-build-handoff.md) (ranked gaps G1–G14),
[`../07-roadmap-metrics-risks.md`](../07-roadmap-metrics-risks.md) (phases, metrics, risks),
[`2026-11-14-localization-rollout-guide.md`](2026-11-14-localization-rollout-guide.md)

This plan does not replace the handoff's G-list. It adds what a full verification pass on
20 November found that no document had recorded, and it re-orders the front of the queue so
shipped defects and deploy drift are fixed before more tables are added.

---

## 1. Measured starting point (FACT)

Everything below was run against the tree and the live deployment on 20 November 2026.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean, exit 0 |
| `npx vitest run` | 19 files passed, 5 skipped · **178 tests passed, 25 skipped** · 2.3 s |
| `npm run build` | passes; 47 app routes + 8 route handlers |
| Live pages, signed out | all public routes 200; all 32 app routes 307 → `/login` |
| Live pages, signed in | 32/32 rendered, no 5xx, no error boundary |
| Live API, 16-probe matrix | **3 endpoints return 500** (see §3) |
| Live interactive check | **`/services` toggle forms are dead** (React error, digest `3374459225`) |
| Production data | **0 quotations, 0 invoices, 0 events** across 2 organisations |
| `main` vs `origin/main` | `main` is **2 commits ahead**; tree has **53 untracked + 32 modified** files |
| i18n | `npm run i18n:audit` → **467** untranslated candidates; 2 keys missing at runtime |
| CI | **none** — no `.github/workflows` |
| E2E | **none** — Playwright not installed, no `test:e2e` script |
| Lint | **none** — no ESLint flat config and no `lint` script (`AGENTS.md` §8 references it) |
| Error monitoring | **none** — no Sentry or equivalent |
| Integration tests | 25 skipped without `TENANCY_LIVE_TEST=1` |

**The honest summary:** the product builds, the pages render, the money engine is unit-tested,
and the public surfaces are fast (~0.2 s TTFB warm on `bom1`). What is missing is proof that
the *writes* work, and the live deployment is a stale build of `main`. Those two facts are why
this plan puts verification and deploy hygiene ahead of G5.

---

## 2. Track 0 — Ship what already exists (0.5–1 day)

Nothing new is built here. The code is written, verified locally, and undeployed.

**FACT:** these are 404 on live purely because they are unpushed/untracked:
`/favicon.ico`, `/apple-icon.png`, `/p/[slug]/services/[item]`,
`/p/[slug]/opengraph-image`, `/audit`.

| Step | Detail | Done when |
|---|---|---|
| 0.1 | Commit **by path** (never `git add -A`): the two icons, `app/(app)/audit/`, `app/p/[slug]/services/`, `app/p/[slug]/opengraph-image.tsx`, plus whatever of the 32 modified files that agent owns | `git status` shows only other agents' work |
| 0.2 | Add `scripts/smoke.mjs`: fetch ~20 critical URLs, assert expected status, exit non-zero on any 5xx | runs in < 30 s against live and preview |
| 0.3 | Deploy and run the smoke script against production | every route in the script returns its expected status |
| 0.4 | Add the missing `lint` script + ESLint flat config so `AGENTS.md` §8 stops lying | `npm run lint` passes |

**Why first:** the deployed product is the thing that sells. Every hour it serves a stale build,
the 404s look like defects to a prospective customer who clicks a shared link.

---

## 3. Track 1 — Fix the defects verification found (2–3 days)

Each item is a real failure observed on live, with the reproduction attached.

### 1.1 `/services` — the Enable / Turn off buttons do nothing

- **Evidence:** `app/(app)/services/page.tsx:126` renders `<form action={…} onSubmit={…}>`
  inside a Server Component. Five React errors per render: *"Event handlers cannot be passed
  to Client Component props"*, digest `3374459225`. The handler never reaches the browser.
- **Options:** (a) extract a `"use client"` `ServiceToggle` component; (b) drop `onSubmit`
  and let the server action own the transition with `revalidatePath`.
- **Recommendation:** (b) — fewer moving parts, and it removes the manual `fetch` +
  `window.location.reload()` round trip.
- **Done:** toggling a service off and on again changes `business_services` and the catalogue
  count on the same screen, with no console error.

### 1.2 Three API endpoints return 500

| Endpoint | Observed | Cause | Fix |
|---|---|---|---|
| `GET /api/admin/services` | 500 for signed-in **and** anonymous callers, 0.37 s | `TypeError: Cannot destructure property 'section' …` — the handler destructures `{ params }` which does not exist on a static route, before any auth check | **Delete it.** Nothing in `app/`, `components/` or `lib/` calls it; `/admin` reads the data directly. If it is wanted later, rebuild it with a query param and a UUID guard |
| `GET /api/share/[slug]` (non-UUID) | 500, 0.28 s, public and unauthenticated | raw string passed to a `uuid` column → Postgres `22P02` | validate the UUID shape → 404 |
| `GET /api/quotes/[id]/pdf` (non-UUID, signed in) | 500, 0.53 s | same `22P02` | validate the UUID shape → 404 |

- **Done:** the 16-probe matrix in §6 returns zero 5xx, signed out and signed in.

### 1.3 Two i18n defects visible to users

- **`/portfolio`** — the browser tab reads `portfolio.title`. `app/(app)/portfolio/page.tsx:18`
  asks for a key that has no entry in `lib/i18n/messages/en/portfolio.ts`.
- **`/invoices`** — the status tabs print `invoices.tab.part_paid` three times. The catalogue
  defines `partPaid` (`lib/i18n/messages/en/invoices.ts:26`) but the row status is the enum
  value `part_paid`. Fix by mapping the enum to the key, **not** by renaming the key —
  renaming deletes a shipped key, which `AGENTS.md` §6 forbids.
- **Done:** no raw key in any title or tab; `npm run i18n:audit` total falls; English copy
  byte-identical elsewhere.

### 1.4 `/events/new` collides with `/events/[id]`

- **Evidence:** `GET /events/new` matches the dynamic route with `id="new"` and logs
  `invalid input syntax for type uuid: "new"`. It returns 200 with an empty content area.
  Nothing links to it, so only a typed URL hits it.
- **Done:** either add the real create-event route, or guard `[id]` with a UUID check that
  calls `notFound()`. Pick whichever matches how events are actually created today.

### 1.5 `/api/share/[slug]` uses an event UUID as a capability

- **Evidence:** anonymous `GET` returns title, date, venue, address, guests, notes, `orgId`
  and the service list for any event id, with no token and no published check. The file's
  own comment calls it a "public share link", but there is no link secret — `/share/[token]`
  and `/q/[token]` do this correctly with real tokens.
- **Recommendation:** retire the route in favour of `/share/[token]`, or add a token. Decide
  before any customer-facing link is built on it. This is a **design decision, not a bug fix** —
  it needs a line in `docs/designs/` before code.

---

## 4. Track 2 — Make "it works" provable (about a week)

Without this, every future slice is verified by hand, by whoever happens to be free, on
production data.

| Item | What | Why now | Size |
|---|---|---|---|
| **2.1** | Playwright golden path: signup → onboarding → compose quote → send → open `/q/[token]` → accept → raise invoice → record payment. Dedicated **test org**, torn down after each run | **FACT:** the production DB has 0 quotations, so the PDF, exports and acceptance paths have never been exercised end to end. This is the single biggest unverified surface | M |
| **2.2** | GitHub Actions: `tsc`, `vitest`, `build`, and the e2e run against a preview deploy. Merge blocked on red | Deploy lag (Track 0) recurs without it; nothing currently stops a broken `main` reaching production | S |
| **2.3** | Error monitoring with a documented free-tier limit in `docs/04` (Sentry free tier, or Vercel log drains). Alert on 5xx rate and on the `[i18n] missing key` line | The three 500s in Track 1 were invisible for an unknown period | S |
| **2.4** | `TENANCY_LIVE_TEST=1` in CI on a schedule (not every PR) | 25 tests — the RLS proofs — currently never run automatically | S |
| **2.5** | Seed script for a **non-demo** test org with one event, one quote, one invoice | Makes 2.1 possible without touching customer data | S |

**Done when:** a red build cannot merge, a broken screen reaches no one, and the golden path
runs unattended in under five minutes.

---

## 5. Track 3 — Resume the ranked backlog

G1–G4 and G9 are done per the handoff. Two re-orderings are proposed, both for reasons the
handoff's own dependency logic permits.

| Order | Gap | Why here | Size |
|---|---|---|---|
| **3.1** | **G10 Backup export/import + one restore drill** | It is a **Phase 1 exit criterion** and risk R4. Today there is no export and no drill recorded | M |
| **3.2** | **G11 Credit notes** | Money correctness: payments are append-only with no reversing entry, so a refund is currently unrepresentable | S |
| 3.3 | G5 Client merge | Handoff's next item; unblocks dirty production data | M |
| 3.4 | G8 Shift rota, leave, check-in | Roadmap Phase 2 "staff assignment"; `/me` is read-only today | M |
| 3.5 | G6 Event transport, rentals, requirements | Costs currently leak out of margin | M |
| 3.6 | G7 Recipes → stock/purchase list | Depends on G6's requirement explosion | M |
| 3.7 | G13 Admin suspend/reactivate | Small; `/admin` is read-only | S |
| 3.8 | G12 Moderated reviews + map | Storefront social proof; needs moderation first | M |
| 3.9 | G14 Billing ADR, then plan limits | Blocked on an ADR by rule (`AGENTS.md` §3). No gateway code before it | L |

Every item still lands as one vertical slice — schema + policy + action + UI + test — with a
design doc first. The handoff's §3 rules stand unchanged.

---

## 6. The verification matrix to reuse

Run these before claiming any slice is done. Expected status in brackets.

**Anonymous, 16 probes**

```
GET  /api/health                                  [200]
GET  /api/exports, ?kind=ledger, ?kind=monthly    [307 → /login]
GET  /api/quotes/<uuid>/pdf, /not-a-uuid/pdf      [307 → /login]
GET  /api/admin/services                          [404 or 403 — never 500]
GET  /api/share/<uuid>, /not-a-uuid               [404, never 500]
POST /api/share/<uuid>/submit  {}                 [400]
POST /api/vitals  valid and garbage               [204]
GET  /auth/callback  no code / bad code / evil next [307 → /login?error=link]
GET  /favicon.ico, /apple-icon.png, /icon.svg     [200]
POST server action, unknown id                    [404]
POST server action, foreign Origin                [blocked, not 500 where possible]
```

**Signed in, per page:** status, `<title>` free of raw `a.b` keys, no `nextjs-portal` error
overlay, no `[i18n] missing key` in the server log, TTFB under 300 ms warm.

**Before any deploy:** `npm run typecheck && npm test && npm run build`, then the smoke
script against the preview URL, then the same script against production.

---

## 7. Parallel, small, continuous

These are not sprints; they are habits that should ride along with every slice.

- **Localization:** 467 candidates. One module per surface, English unchanged, `ta` mirrored
  as `DeepPartial`, `SEED — unreviewed` until a native speaker signs off. Pull the number
  into each PR description so the trend is visible.
- **Performance:** the live public pages measured TTFB ~0.2 s warm, landing load 742 ms,
  43 KB JS transferred. Outstanding: `/menu/translations` (850 KB HTML) and
  `/storefront/customise` (648 KB) are the two heaviest signed-in screens — confirm against a
  production build and, if it holds, paginate or narrow the payload.
- **Web vitals:** `/api/vitals` already accepts LCP/CLS and logs one JSON line, but nothing
  reads it. Add a weekly query or delete the endpoint — a metric nobody reviews is dead weight
  (docs/07 §2 says exactly this).

---

## 8. Explicitly not planned

Repeating these here so no agent reopens them by accident:

- A marketplace or lead sales — **ADR-008**, Phase 4 gate: 30+ verified responsive providers
  in one city.
- Any payment gateway, pay-now flow or subscription billing code **before** the G14 ADR.
- AI-assisted pricing — **ADR-010**, revisit only after three months of a trusted engine.
- Native apps, Docker locally, or anything writing to `C:`.

---

## 9. Risks this plan carries

| Risk | Trigger | Mitigation |
|---|---|---|
| Deploy drift returns | `git log origin/main..main` non-empty for > 1 day | CI deploy from `main` (2.2) + smoke script (0.2) |
| A defect ships because nothing exercised writes | any escape | Golden-path e2e (2.1) is the gate for the whole G-list |
| Hand-verification burns a day per slice | > 2 h spent probing by hand | reuse §6, and extend the matrix as slices land |
| Another agent's uncommitted work is lost | a `git reset`/`checkout` on the shared tree | commit by path only; never `add -A` (`AGENTS.md` §4.5) |
| Plan rots | document not updated after a slice | update the status table in §1 on every merge |

---

## 10. First three days, concretely

| Day | Work | Evidence produced |
|---|---|---|
| 1 (morning) | Track 0: commit by path, smoke script, deploy | live `/favicon.ico` and `/p/kannan-events/services/catering` return 200 |
| 1 (afternoon) | 1.1 `/services` toggle + 1.4 `/events/new` guard | toggle a service on live, read the row back |
| 2 (morning) | 1.2 the three 500s + 1.3 the two i18n keys | §6 matrix shows zero 5xx; `i18n:audit` total falls |
| 2 (afternoon) | 2.5 test-org seed script | one non-demo org with an event, quote and invoice |
| 3 | 2.1 Playwright golden path, first passing run | a CI log showing the whole flow green |
