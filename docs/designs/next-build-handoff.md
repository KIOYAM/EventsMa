# Handoff — what is left to build

**Measured:** 14 November 2026, against `main` @ `d9438cd` and the live deployment.
**Purpose:** hand the remaining work to another agent without them guessing what
already exists. Read this with [`../12-prototype-page-parity.md`](../12-prototype-page-parity.md);
that document is the page-by-page view, this one is the dependency-ordered build plan.

## 1. What already exists (do not rebuild)

| Area | State | Evidence |
|---|---|---|
| Workspace | 47 routes: dashboard, clients, events (+calendar), quotes, invoices, finance, inventory, menu, packages, catalogue, portfolio, storefront, team, reports, settings, submissions, admin, services | `app/**/page.tsx` |
| Multi-service | `business_services` + `service_items` with `vertical_key`, `unit_class` (`PER_GUEST`/`PER_PIECE`/`FLAT`/`PER_HOUR`), per-vertical workspaces for decoration, makeup, photography | migrations 0004–0005 |
| Quote engine | Server-priced composer across any enabled service, immutable sent versions, public `/q/[token]`, manual bank/UPI, append-only receipts, PDF | `components/quote`, `lib/domain/pricing` |
| Share portal | `share_links` → public `/share/[token]` → `share_submissions` → `/submissions` owner review → status transitions | migration 0006, verified end to end 14 Nov |
| Catering menu selection | Public link renders the event's real sessions, categories, dishes and min/max rules; selections are validated server-side and stored per session (`share_submission_sessions` + lines with session/category) | migration 0007, `lib/domain/menu-selection.ts`, verified 14 Nov |
| Database | 57 tables, 57 with RLS, 111 policies, two-tenant isolation test PASS | `node db/setup.mjs` |
| Runtime tenancy | Authenticated requests run inside `withWorkspace` on a scoped handle, so RLS applies to real traffic; `getSystemDb` is reserved for token/public paths. Integration test: 5/5 green against the live database | `lib/db/tenancy.integration.test.ts`, `TENANCY_LIVE_TEST=1 npx vitest run lib/db/tenancy.integration.test.ts` |
| Quality gates | `npm run build`, `npx tsc --noEmit`, `npx vitest run` (46 tests) | green on `main` |

## 2. The gaps, in dependency order

Order is not taste. Each row's reason column explains why it cannot be shuffled later.

| # | Work | Why now, and what "done" means | Size |
|---|---|---|---|
| **G1** | **Public-path tenancy proof** | Authenticated traffic is covered: `withWorkspace` scopes the handle and the integration test proves a tenant-A request cannot read tenant-B rows. The **token paths are not covered** — `/share/[token]`, `/q/[token]`, `/p/[slug]` and `/invite/[token]` deliberately use `getSystemDb` because there is no session, so their safety rests on hand-written `org_id` filters with no test. Done = one test per public entry point proving a token minted for tenant A cannot resolve tenant B's event, quote, page or invitation. | M |
| **G2** | **Submission → quotation** | A share link now ends at a review screen whose "Prepare quotation" drops the owner on an empty composer. Done = the composer opens prefilled with the submission's client, event and selected lines, the created quote records which submission produced it, and `/submissions` shows "quoted" only when a quote links back. | M |
| **G3** | **Public endpoint abuse control** | `/api/share/[token]/submit` and the `/p/[slug]` enquiry form are unauthenticated writes with no rate limit or bot check. Done = per-IP and per-token limits that return a clean `429`, a honeypot field, and the same dedupe guarantee that exists today. | S |
| **G4** | **Run-of-show + activity viewer** | Audit rows are written for money and status changes but no screen reads them, and event day has no minute-by-minute sheet. Done = per-event run-of-show (timed rows, owner/crew visible) and an org audit list filterable by entity, both read-only. | M |
| **G5** | **Client merge** | Phone dedupe prevents new duplicates but cannot fix old ones; today the only repair is SQL. Done = merge two clients with a preview of what moves (events, quotes, invoices, submissions), executed in one transaction, reversible by nothing but a fresh merge. | M |
| **G6** | **Event transport, rentals, requirements** | The prototype prices transport, rentals and per-guest requirements; events carry none of it, so those costs leak out of margin. Done = event fields plus requirement explosion into an inventory purchase list. | M |
| **G7** | **Recipes to stock** | `catering/recipes` and `inventory` exist but never meet: no dish-to-ingredient cost, no event purchase list. Done = per-dish cost from the ledger and a per-event pull list with on-hand vs shortfall. | M |
| **G8** | **Shift rota, leave, check-in** | `/me` lists assigned events only; a crew member cannot say "I am here" or ask for a day off. Done = assignment with date/shift, leave request with approve/deny, check-in that stamps the task. | M |
| **G9** | **Portfolio photos** | A text-only portfolio does not sell; menu images already prove the Storage path (`lib/storage/menu-images.ts`). Done = upload with compression and quota, ordered gallery, publish gate, signed URLs on `/p/[slug]`. | M |
| **G10** | **Backup export/import + restore drill** | Settings has no export, and Phase 1 exit criteria demand one completed restore. Done = org-scoped JSON export, import into an empty org, and a written drill result. | M |
| **G11** | **Credit notes** | Payments are append-only by rule; there is no reversing entry, so a refunded receipt is unrepresentable. Done = credit note that references the invoice, appears in finance and cannot be edited. | S |
| **G12** | **Storefront reviews + map** | Public page has no social proof and no location. Needs moderation before it can exist. Done = moderated review table, owner reply, aggregate on `/p/[slug]`. | M |
| **G13** | **Platform admin actions** | `/admin` is read-only. Done = suspend/reactivate organisation with a reason, platform event log, CSV. | S |
| **G14** | **Commercial layer** | Phase 2 needs trial, plan limits and a GST invoice; there is no billing ADR, and `AGENTS.md` forbids a payment dependency without one. Done = ADR, then plan limits enforced server-side. | L |

Sizes: S ≤ 1 day, M 2–4 days, L a week or more for one developer.

### Status at 16 November 2026

The table above is the 14 November snapshot and is kept as written. Since then, checked
against the tree, not against a memory of it:

- **G1 done** — `lib/db/public-token-isolation.integration.test.ts` proves each of the
  four token paths cannot resolve another tenant's event, quote, page or invitation
  (run with `TENANCY_LIVE_TEST=1`).
- **G2 done** — `getSubmissionPrefill` feeds `quotes/new`; `/submissions` derives the
  quoted badge from `submission.quoteNumber`.
- **G3 done** — `lib/security/rate-limit.ts` plus `db/migrations/0010_rate_limits.sql`;
  honeypot and per-IP/per-token limits on `/p/[slug]` and `/api/share/[slug]/submit`.
- **G9 done** — portfolio upload with browser-side compression, quota, ordering,
  publish gate and signed URLs.
- **G4 done (19 Nov)** — the per-event operations tab plus `/audit`: an org-wide,
  read-only list of `audit_events`, filterable by record type, cursor-paged, with each
  row naming its actor and the `after` payload in readable form. Owners and managers
  only, matching the table's own RLS policy. Formatter tests: `lib/domain/audit.test.ts`.
- **G5, G6, G7, G8, G10–G14 remain open.** Their rows above are still accurate.

Start the next slice at G5, not at G1.

See [`2026-11-16-storefront-and-backlog-audit.md`](2026-11-16-storefront-and-backlog-audit.md)
for the evidence behind each line and the storefront change that shipped with it.

## 3. Two rules for whoever picks this up

1. **G1 first.** The authenticated path is proven, but the four token paths are the ones an outsider can call. Prove them before adding tables they would also have to defend.
2. **One vertical slice per change:** schema + policy + server action + UI + test, then
   commit. A green build is not evidence; the evidence is a real row in the real
   database and a screenshot of the screen that reads it.

## 4. Paste-ready prompt for the next agent

```
You are continuing an existing, deployed product. Do not rebuild it, do not
re-scaffold it, and do not add a dependency without a written reason.

PROJECT: EventsMa — multi-service event-business SaaS (Indian market): catering,
decoration, makeup, photography. Next.js App Router + TypeScript, Tailwind,
Drizzle ORM + SQL migrations, Supabase Postgres/Auth/Storage, Resend, Vercel.

READ FIRST, IN THIS ORDER:
  AGENTS.md                                  (hard rules, disk constraint, gates)
  docs/designs/next-build-handoff.md         (what exists, ranked gaps G1–G14)
  docs/designs/multi-service-share-portal.md (how the share portal is built)
  docs/12-prototype-page-parity.md           (page-by-page status)
  docs/designs/README.md                     (design-doc template you must use)

ENVIRONMENT:
  Repo root: D:\Kannan-Projects\EventsMa (never use C: for caches, temp or installs)
  export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
  export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"; TEMP/TMP="$TMPDIR"
  Live: https://eventsma.vercel.app   Health: /api/health must report database ok.
  DATABASE_URL in .env.local is the working Supabase *pooler* URL (port 6543).
  DIRECT_URL is a dead hostname — it does not resolve. For any db script, either
  unset DIRECT_URL or set it to the pooler value:
    export DIRECT_URL="$(node -e "process.loadEnvFile('.env.local');process.stdout.write(process.env.DATABASE_URL)")"
  Never print, commit or paste a connection string or key.

WHAT IS ALREADY DONE — do not redo:
  57 tables, RLS on all 57, 111 policies, two-tenant isolation test passing; runtime
  tenancy through withWorkspace proven live (5/5).
  Migrations 0000–0007 applied on production. Quote engine with immutable sent
  versions, public /q/[token], manual bank/UPI, append-only receipts. Share portal
  share_links -> /share/[token] -> share_submissions -> /submissions, verified end
  to end. 47 routes in app/**. Build, tsc and 46 unit tests green.

YOUR QUEUE, in this order. Stop and report after each item; do not batch items.
      G1 Public-path tenancy: authenticated requests already run inside withWorkspace
     on a scoped handle and the live integration test proves RLS applies (5/5). The
     remaining hole is the token paths — /share/[token], /q/[token], /p/[slug] and
     /invite/[token] — which use getSystemDb because there is no session. Add one
     test per path proving a token minted for tenant A cannot resolve tenant B's
     event, quote, page or invitation.
  G2 Submission -> quotation prefill, with the quote recording its source
     submission and /submissions showing "quoted" only when that link exists.
  G3 Rate limit + honeypot on the unauthenticated /api/share/[token]/submit and
     /p/[slug] enquiry endpoints; clean 429; keep existing dedupe.
  G4 Per-event run-of-show and an org-scoped audit viewer over the rows already
     being written.
  G5 Client merge: preview of what moves, one transaction, phone/email dedupe kept.
  G6 Event transport, rentals and per-guest requirements, priced into margin.
  G7 Dish recipes -> per-event purchase list with on-hand vs shortfall.
  G8 Shift rota, leave request with approval, check-in from /me.
  G9 Portfolio photo upload (compression, quota, ordering, publish gate, signed URLs).
  G10 Org JSON export/import plus one written restore drill.
  G11 Credit notes as reversing entries; never edit a recorded payment.
  G12 Moderated storefront reviews with owner reply; map embed from settings.
  G13 Admin suspend/reactivate with reason, platform log, CSV.
  G14 Billing ADR first, then plan limits enforced server-side. No gateway code
      before the ADR is merged.

NON-NEGOTIABLES (from AGENTS.md, reviewed adversarially):
  org_id on every tenant table, RLS enabled, two-tenant test passing.
  Money in integer paise; totals computed on the server; the browser total is a preview.
  Sent quotations immutable; edits create a new version. Payments append-only.
  No secrets in the client bundle, git or logs. No fake data in production.
  Files under 400 lines. Design doc before any feature larger than a bug fix.

VERIFY BEFORE EVERY CLAIM — run, and paste the real output:
  npx tsc --noEmit
  npm run build
  npx vitest run
  node db/setup.mjs            (expect: 56 tables, 56 with RLS, isolation PASS; the
                                table count grows as you add migrations — report the
                                real number, do not copy this one)
  Then exercise the feature on the live deployment with a real row: create it,
  read it back from Postgres, screenshot the screen that shows it, delete the test
  row, and confirm the counts return to zero.

REPORTING RULES:
  Say what you ran and what it printed. Never claim a screen works because the
  build passed — a form that submits nothing still builds. If you could not test
  something (no account, no key, blocked host), say exactly that. Commit one slice
  at a time with a message that explains why, and push to main; Vercel deploys from
  GitHub, there is no local Vercel CLI.
```

## 5. Known traps

- `DIRECT_URL` is dead. `drizzle.config.ts` and `db/setup.mjs` prefer it, so any
  migration run needs the override above (or the config changed to fall back).
- A submit button's `name`/`value` is **not** serialised by a Next server-action form.
  Every action that branches on a choice needs a hidden input in its own form.
  This shipped as a live bug on 14 Nov and is fixed in `fe15627`.
- `max_pipeline: 1` in `lib/db/client.ts` is deliberate: the transaction pooler
  assigns pipelined statements to different connections and pages hang.
- Demo mode refuses writes; production refuses the demo workspace. Test with a real
  session, not a fixture.
