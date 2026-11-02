# EventsMa — setup and status

Single Next.js application for a multi-vertical event-services business: catering, decor,
photography or any specialist service, quoted in one document with server-verified money.

## Disk rules (non-negotiable)

`C:` is at ~97%. Every cache and temp path points into this repository:

```bash
export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
export TEMP="$TMPDIR"
export TMP="$TMPDIR"
mkdir -p .cache/npm .cache/tmp .cache/logs
```

`.npmrc` pins the npm cache. There is no Docker, no local Postgres and no global install.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm test           # vitest: pricing engine, 300 generated cases
npm run build
npm run db:generate   # drizzle-kit, writes db/migrations
npm run db:migrate    # apply to DIRECT_URL
```

## Connect a database

1. Copy `.env.example` to `.env.local` and fill the Supabase values (Mumbai, `ap-south-1`).
2. `npm run db:generate` then `npm run db:migrate`.
3. Apply RLS: `psql "$DIRECT_URL" -f db/policies.sql`.
4. Sign in; the workspace bootstrap creates org + business + owner membership.

Without those values the app runs in **labelled demo mode**: every screen shows a "Demo data"
badge and all writes are refused. There is no fake data in a live workspace.

## Architecture, in one screen

```
app/(app)/            authenticated shell: dashboard, services, catalogue, quotes
app/q/[token]/        public quote view — no session, no margin
app/api/health/       config probe, no secrets
lib/domain/           money, units, pricing — pure, no I/O, fully tested
lib/db/               Drizzle schema, pooled client, org-scoped queries
db/policies.sql       RLS: is_org_member / has_org_role, two-tenant test
components/           design system + composer + quote document
```

### The decision that shapes everything

A business declares **which services it provides**. Each service is a descriptor
(`lib/domain/verticals.ts`) with its own item noun, allowed unit classes, default tax and
configuration fields. Catalogue rows carry `vertical_key`; quotation lines carry `service_key`.
The pricing engine has **zero vertical-specific branches** — it only knows unit classes:

`PER_GUEST` · `PER_UNIT` · `FLAT` · `PER_HOUR` · `PER_DAY`

Adding a service is a descriptor, not a maths change. That is what lets a planner sell five
services and a specialist sell one, in the same product.

### Money rules enforced by code

- Integer paise only; `lib/domain/money.ts` is the only place that formats.
- Totals recomputed on the server; the client preview never becomes the stored value.
- A sent quotation is frozen as `quotation_versions` + `quotation_lines`; revising creates v2.
- Per-line tax, largest-remainder discount allocation, explicit rupee round-off.
- Over-sized discounts clamp **and report** the clamp; nothing is silently swallowed.
- `min_quantity` is enforced in the engine, so a 100-guest package cannot be billed at 30.

## Performance decisions already in place

- Server Components and streaming; skeletons reserve layout space (no CLS).
- Explicit column selection; every tenant index leads with `org_id`.
- No chart library, no table library, no URL-state library in the client bundle.
- `optimizePackageImports` for icon/UI barrels; AVIF then WebP for images.
- Immutable caching for `/_next/static`; self-hosted fonts, two weights, `display: swap`.

## Built in this pass

- Deterministic A4 PDF at `/api/quotes/[id]/pdf`.
- Immutable revisions: `quotation_versions` N+1, version N never touched.
- Public profile page at `/p/[slug]` with enquiry intake, phone dedupe and a queued notification.
- Zero-fee UPI collection on the customer quote (set `BUSINESS_UPI_VPA`).
- Razorpay webhook: HMAC verification, tenant resolution from notes, idempotent append-only payment rows.

## Not built yet (deliberately, in order)

1. Sign-in, workspace bootstrap (`bootstrap_org`) and invitations.
2. Applying `db/policies.sql` and running the two-tenant suite with a restricted role.
3. Enquiry inbox and the worker that drains `notifications`.
4. Payments UI calling `createRazorpayPaymentLink`.
5. Availability check on save; revisions that edit lines instead of copying them.
6. ESLint flat config and Playwright e2e.

## Verification

```bash
npm run typecheck && npm test && npm run build
```

A passing build is not evidence the product works. The two-tenant RLS test and a real phone
check are the gates that matter.
