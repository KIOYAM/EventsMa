# Production storefront — Phase 0 repository audit

**Date:** 2026-11-17 · **Status:** Phase 0 audit complete · **Phase 1 shipped** (see §10)
**Scope:** read-only. No schema, route or behaviour change is made by this document.
**Reference:** `FeastFlow_Marketplace_220_Accounts_Client_Portal.html` (UX reference only).

## 1. What already exists (verified in this repository)

| Area | Reality | Evidence |
| --- | --- | --- |
| App | Next.js 15 App Router, TypeScript, Tailwind, Drizzle + SQL migrations, Supabase Postgres/Auth/Storage | `package.json`, `db/migrations/0000…0011` |
| Tenancy | 61 public tables, 118 RLS policies, every operational table carries `org_id`; policies in one hand-maintained file applied after migrations | `db/policies.sql`, live `pg_policies` count |
| Auth | Supabase session refreshed in `middleware.ts`; `requireWorkspace()` re-checks before render; roles owner/manager/… via `canManageCommercial` | `lib/auth/session.ts`, `middleware.ts` |
| Service registry | Verticals are data rows with `capabilities`, `routes`, `configSchema`, `seedItems`; `GENERIC_VERTICAL` fallback | `lib/domain/verticals.ts` (catering, photography, decoration, makeup incl. `appointments`, `trials`) |
| Catalogue | Per-vertical service items, categories, packages, cross-service inclusions | `lib/db/schema-services.ts`, `lib/db/packages.ts` |
| Public storefront | `/p/[slug]` SSG page, three designs, brand colour, sections (order/visibility/heading/image), logo, descriptor, introduction, share strip | `app/p/[slug]/page.tsx`, `lib/db/public.ts`, `lib/db/storefront.ts`, migration `0011` |
| Public DTO | Explicit allowlist objects; no raw row is returned; internal costs never leave the server | `lib/db/public.ts` |
| Customer share link | Owner token → `/share/[slug]` catalogue selection → `/api/share/[slug]/submit` → durable submission | `lib/db/schema-share.ts`, `lib/db/share-submissions.ts` |
| Enquiry persistence | `share_submissions` with `dedupe_key` (idempotency), `status`, `indicative_total_paise`, per-service rows and priced lines, optional `enquiry_id` | `schema-share.ts`, `createShareSubmission()` |
| Rate limiting | `rate_limits` table, honeypot field on the public form, verified live earlier (6th request → `?error=ratelimited`) | migration `0010`, `app/p/[slug]/enquiry` path |
| Quote conversion | Owner converts a submission into a quote (`/quotes/new` accepts a submission) | `app/(app)/quotes/new/page.tsx`, migration `0009` |
| Notifications | `queueNotification()` → `sendQueuedNotification()` (Resend) with retry/dead states | `lib/email.ts` |
| Media | Private Supabase bucket, signed URLs with 24h TTL, browser-side compression, server-side MIME/size validation, per-tenant prefix `${orgId}/…` | `lib/storage/portfolio-images.ts`, `storefront-image.ts` |
| i18n | `lib/i18n/` engine, `en` + `ta` modules, `npm run i18n:audit` = 473 candidates | `lib/i18n/messages/**` |
| Signed-in evidence | Brand studio save → public render verified end-to-end this week (colour, wordmark font, descriptor, introduction) | design doc `2026-11-16-storefront-customise.md` §6 |

## 2. What does not exist

| Missing capability | Consequence today |
| --- | --- |
| Storefront versions / draft-publish separation | Edits are live immediately; there is no rollback and no "preview before publish" |
| Pages and navigation | One page per business; no About/Services detail/Portfolio/FAQ routes |
| Section schema versioning | Sections are a fixed four-key enum with typed columns, not versioned JSON settings |
| Service detail templates | Catalogue only appears inside one section; no `/services/{item}` page |
| Booking / availability | `capabilities` declares `appointments`/`scheduling`, but there is no slot model or conflict check. Instant booking must stay off |
| Marketplace | Nothing. No listing, search, opt-in or provider directory |
| Custom domains | Nothing. Slug-only, `NEXT_PUBLIC_APP_URL` based |
| SEO | No sitemap, robots rules, canonical or OG image per storefront |
| Analytics | Only `/api/vitals` (field LCP/CLS). No storefront funnel |
| Storefront enquiry source attribution | `share_submissions` has no source/version columns, so a storefront lead cannot be told apart from a catalogue share |

## 3. Capability status (required vocabulary)

| # | Capability | Status |
| --- | --- | --- |
| 1 | Tenant storefront identity (name, logo, brand colour, type, descriptor, intro) | IMPLEMENTED AND VERIFIED |
| 2 | Section composition (order, visibility, per-section heading, hero image) | IMPLEMENTED AND VERIFIED |
| 3 | Three renderer designs, previewed against real tenant data | IMPLEMENTED AND VERIFIED |
| 4 | Public page published/unpublished switch | IMPLEMENTED AND VERIFIED |
| 5 | Shareable public URL (slug) + copy/WhatsApp share | IMPLEMENTED AND VERIFIED |
| 6 | Public enquiry persistence, idempotent, server-priced, rate-limited, notifies owner | IMPLEMENTED AND VERIFIED (for catalogue share links) |
| 7 | Storefront-originated enquiry | PARTIALLY IMPLEMENTED (form exists on the public page; no `source`/version attribution) |
| 8 | Draft vs published versioning, immutable snapshots, rollback | IMPLEMENTED AND VERIFIED |
| 9 | Multi-page storefront (pages, navigation, dynamic service detail) | NOT IMPLEMENTED |
| 10 | Service-aware public content (capability-driven fields/CTAs per vertical) | PARTIALLY IMPLEMENTED (catalogue section is vertical-aware; no service pages) |
| 11 | Custom domains | NOT IMPLEMENTED |
| 12 | SEO (metadata, sitemap, canonical, OG) | NOT IMPLEMENTED |
| 13 | Storefront analytics funnel | NOT IMPLEMENTED |
| 14 | Marketplace discovery | NOT IMPLEMENTED |
| 15 | Booking with availability | BLOCKED (no availability model; instant booking must not ship) |

## 4. Architecture decision: versioning without a second source of truth

The spec proposes `storefronts`, `storefront_versions`, `storefront_pages`,
`storefront_sections`, `storefront_navigation`, `storefront_theme_settings`,
`storefront_domains`. Six of those would duplicate what migration `0011` already
stores (`storefront_sections`) and what `businesses.settings.brand` already holds.

Proposed shape — **draft rows stay normalised, published state is a snapshot**:

| Store | Purpose | Shape |
| --- | --- | --- |
| `storefront_sections` (exists) | the owner's **draft** — what the editor writes to | rows keyed by `org_id` + `section_key` |
| `businesses.settings.brand` (exists) | draft brand tokens | JSON, already read by `lib/domain/storefront.ts` |
| `storefronts` (new) | identity and publication pointer | `org_id`, `slug`, `status`, `published_version_id`, `published_at` |
| `storefront_versions` (new) | immutable published snapshots | `storefront_id`, `version`, `snapshot jsonb` (sections + brand + pages + seo), `schema_version`, `created_by`, `created_at` |

Why: the editor keeps working against typed rows it already understands (small blast
radius, no rewrite of `lib/db/storefront.ts`), while the public page reads one immutable
JSON snapshot — so a half-finished edit can never appear live, and rollback is
"copy snapshot N into the draft, then publish as N+1". Normalised pages/navigation only
become their own tables when multi-page ships (Phase 3), and they slot into the same
snapshot rather than changing the publish model.

`/p/[slug]` stays the public route. Renaming to `/s/{slug}` would break live links for no
user-visible gain; sub-pages follow the existing path (`/p/[slug]/services/[item]`).

## 5. Data changes (proposed, not applied)

Migration `0012_storefront_publishing.sql`:

```sql
create table storefronts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organisations(id) on delete cascade,
  status text not null default 'draft',          -- draft | published | suspended
  published_version_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table storefront_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  storefront_id uuid not null references storefronts(id) on delete cascade,
  version integer not null,
  schema_version integer not null default 1,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (storefront_id, version)
);
```

Plus, on existing tables:

- `share_submissions`: `source text not null default 'share'`, `storefront_version_id uuid`,
  `landing_page text` — so one enquiry table serves both channels and reports can split them.
  `dedupe_key` already gives idempotency.
- Index `share_submissions (org_id, source, created_at desc)`.

RLS: both new tables get `select`/`write` policies scoped to
`org_id = current_org_id()` like `storefront_sections`; the public read path never touches
them directly — it goes through a server function that validates `status = 'published'`.

**Migration discipline:** `drizzle-kit generate` re-emits `0005`/`0009` objects because
`meta/` lacks their snapshots (recorded in `2026-11-16-storefront-builder.md` §6). `0012`
must be hand-written and followed by `APPLY=1 npm run db:migrate` + `db/policies.sql`, with
the snapshot committed, exactly like `0011`.

## 6. Phased delivery

| Phase | Work | Exit criteria |
| --- | --- | --- |
| 0 | This audit | Done |
| 1 | `storefronts` + versions, publish/unpublish/rollback, snapshot schema validation | Draft edits never change the live page; failed publish leaves previous version; pointer swap is one statement; RLS isolation test passes |
| 2 | Public renderer reads the snapshot; add `/p/[slug]/about`, `/services`, `/services/[item]`, `/portfolio`, `/contact` from tenant data | Every page renders only published data; hidden items absent; sitemap + canonical + OG |
| 3 | Multi-page editor (page tree, per-page sections, navigation) | Owner can add/hide/reorder pages; preview equals public renderer for the same version |
| 4 | Service-aware content: capability-driven section fields and CTAs per vertical | Catering ≠ photography ≠ makeup on the public page, driven by `capabilities` |
| 5 | Storefront enquiry → `share_submissions` with `source='storefront'` → same CRM/quote conversion; owner notification with retry | Duplicate submit is idempotent; enquiry visible in `/submissions`; converts to a quote |
| 6 | Domains + SEO + analytics (needs DNS/Vercel access — see §8) | Verified host renders the tenant; canonical redirect; funnel events |
| 7 | Marketplace (opt-in, published-only search) | Listed only when opted in; no demo providers; leads land in the same CRM |
| 8 | Booking | **Blocked** until an availability/resource model exists; ship "request availability" only |

## 7. Risks

- **Publish snapshots grow.** Sections + brand are small (a few KB); images are paths, not
  bytes. Cap versions retained per storefront (keep last 20, archive the rest).
- **Two readers of brand settings.** Today `getPublicProfile` reads `settings.brand`
  directly; after Phase 1 it must read the snapshot, or drafts leak. One read path, enforced
  by a test that edits the draft and asserts the public HTML is unchanged.
- **Route collisions.** `/p/[slug]` is SSG with `generateStaticParams`; published-only
  rendering must keep `dynamicParams` behaviour and revalidate on publish.
- **Notifications.** Resend keys are configured per environment; without them enquiries
  still persist and queue (correct failure mode, already implemented).

## 8. Blockers that need the user

| Blocker | Needed for | What is required |
| --- | --- | --- |
| Domain management | Phase 6 | DNS access or Vercel domain API token; without it, custom domains cannot be verified |
| Marketplace content policy | Phase 7 | Decision on eligibility (published + opted-in + verified?) before any listing goes live |
| Availability model | Phase 8 | Business decision: slots per staff member vs per resource vs per date. Not implementable from the prototype |

## 9. Immediate next step (done — see §10)

Phase 1: migration `0012`, `lib/db/storefronts.ts` (publish, rollback, read published
snapshot), publish/unpublish actions wired to the existing brand studio, and an isolation
test proving a draft edit never reaches the public page.

## 10. Phase 1 result

### What shipped

| Piece | File |
| --- | --- |
| Migration `0012` (hand-written, idempotent) | `db/migrations/0012_storefront_publishing.sql` |
| Schema + policies | `lib/db/schema.ts`, `db/policies.sql` (`storefronts`, `storefront_versions` in the member-read / manager-write loop) |
| Snapshot model (pure, versioned, validated) | `lib/domain/storefront-snapshot.ts` |
| Publish / rollback / read published | `lib/db/storefronts.ts` |
| Public page reads the snapshot | `lib/db/public.ts` (`getPublicProfile` overlays the published version) |
| Server actions | `app/(app)/storefront/actions.ts` (`publishPage`, `restorePageVersion`) |
| Owner UI | `components/storefront/publish-panel.tsx` on `/storefront/customise`; the overview "Publish page" now publishes a version instead of flipping a flag |
| Copy | `lib/i18n/messages/{en,ta}/storefront.ts` (`publish.*`) |

### Behaviour

- Editing writes draft rows (`storefront_sections`, `settings.brand`, identity columns).
  Nothing a visitor reads changes.
- `publishPage` builds a snapshot from the draft, inserts the next `storefront_versions`
  row, moves `storefronts.published_version_id`, and marks the business published.
- `restorePageVersion` copies an old snapshot back into the draft and publishes it as a
  **new** version. Existing versions are never mutated.
- The public reader trusts only the pointer. A tenant that has never published keeps the
  pre-0012 behaviour, so this migration cannot blank a live site.
- `getPublishedSnapshot` degrades to `null` if the table is missing (a deploy reaching an
  un-migrated database renders the draft instead of a 500).
- Restore lookups are scoped by `org_id` as well as version id: a version id from another
  tenant reports "not found" rather than being copied.

### Verification (evidence)

| Check | Result |
| --- | --- |
| `node db/setup.mjs` | 63 tables, 63 with RLS, 122 policies, two-tenant isolation PASS |
| `TENANCY_LIVE_TEST=1 npx vitest run lib/db/storefront-publishing.integration.test.ts` | 5/5 — publish; **draft does not leak**; publish v2 makes it public; rollback creates v3; tenants stay apart |
| `npx vitest run` | 137 passed, 19 skipped |
| `npx tsc --noEmit` | 0 errors |
| `npx next build` | 0 errors, 48 routes |
| `npm run i18n:audit` | 473 (below the 481 baseline) |
| Browser, real session | “Nothing is published yet” → publish → “Published. Clients see this version now.”, `Version 1 · Live` |
| Production build after a draft mutation | draft `DRAFT NAME 999` / `#c56e4e` while the page served `Kannan Events` / `--brand:#183d33`, no draft string in the HTML |

### Known limitations

- **Catalogue and portfolio are not versioned yet.** Only identity, brand and layout are
  snapshotted; a service item toggled inactive still changes live immediately. That is
  Phase 4, and it is why the isolation test asserts identity, brand and section headings.
- A raw database row appears in the **dev-server** RSC payload for `/p/[slug]`; the
  production build does not contain it (verified). Not a client-visible leak in a
  deployment, but worth removing the cause.
- Publishing needs migration `0012` on whatever database the deployment uses. Local and the
  Supabase project are migrated; a separate production database needs `node db/setup.mjs`
  before the owner UI can publish.
