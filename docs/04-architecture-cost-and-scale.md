# 04 — Architecture, Cost and Scale

**Purpose:** design a production SaaS that runs on ₹0 today, costs about ₹5,500/month
at the first paid step, and does not need a rewrite at 10,000 businesses.

The design is judged on three things: **tenant safety**, **field performance**, and
**cost per active business**. Everything else is negotiable.

---

## 1. Stack decision

| Layer | Choice | Why | Alternative considered |
|---|---|---|---|
| Web app | **Next.js (App Router), TypeScript, React Server Components** | Server rendering for fast first paint and SEO; one codebase for marketing, app and public pages; first-class Vercel support | Remix, SvelteKit, plain Vite SPA (rejected: poor SEO, client-side data waterfalls) |
| UI | **Tailwind CSS + shadcn/ui + Radix primitives** | Accessible behaviour without fighting a component library; copy-in components, no runtime lock-in | MUI (heavy), Chakra (runtime cost), custom CSS (slow to build) |
| Data | **Supabase Postgres (Mumbai region)** | Real SQL, RLS for tenancy, managed backups, familiar tooling | Neon (good, but auth/storage separate), PlanetScale (no free tier, MySQL) |
| Auth | **Supabase Auth** (email + password, magic link, Google later) | Session handling, email verification, reset, JWT with RLS | Clerk (better DX, costs early), Auth.js (more code to own) |
| Files | **Supabase Storage now, Cloudflare R2 at the egress trigger** | 1 GB free is enough for the first ~1,000 businesses if images are compressed; R2 has zero egress fees | S3 (egress cost), UploadThing (another vendor) |
| Payments | **Razorpay** (UPI + cards) | Indian default, payment links, subscriptions, webhooks | Stripe India (invite-only for new merchants), Cashfree |
| Email | **Resend or Brevo free tier** | Transactional email with templates; small volume | Postmark (paid), SES (setup cost) |
| WhatsApp | **`wa.me` deep links first**, Cloud API later | Zero cost, zero approval, uses the owner's own number | Cloud API (per-conversation cost, template approval) |
| Jobs | **Vercel Cron (daily on Hobby) + Postgres `pg_cron` for in-database jobs** | No extra service; reminders and cleanup are daily-granularity anyway | Inngest, Trigger.dev (add later for multi-step workflows) |
| ORM | **SQL migrations + Drizzle ORM** | Typed queries, no heavy runtime, SQL stays visible for RLS and indexes | Prisma (cold-start and binary weight on serverless) |
| PDF | **`@react-pdf/renderer` in a Node route** | Pure JS, no browser; deterministic documents | Puppeteer/Playwright (too heavy for serverless free tier) |
| Monitoring | **Sentry free + Vercel Analytics + Supabase logs** | Errors, Web Vitals, DB slow queries in one place | Datadog (cost) |

**DECISION — one runtime, not two.** Use Next.js route handlers for APIs and webhooks.
Do not also write Supabase Edge Functions for business logic; two runtimes means two
auth models, two deploy paths and two bug surfaces. Use Edge Functions only for
something that must run inside the database's network.

**DECISION — no local Docker.** Docker Desktop stores images on `C:`, which is nearly
full. Local development uses:
1. a second **Supabase cloud project** (`eventsma-dev`) with the same migrations, or
2. a **Supabase preview branch** if available on the plan.

This is unusual but it is the correct trade-off under the disk constraint. Migrations
must therefore be strictly reversible and tested in CI.

---

## 2. System shape

```
Browser (phone-first PWA)
   │  HTTPS, HTTP/2, Brotli
   ▼
Vercel edge (static assets, cache, image optimisation)
   │
   ├── Static / ISR pages  ── public profile, marketing, quote view (cached)
   ├── Server Components  ── dashboard, lists (streamed, no client fetch waterfall)
   └── Route handlers     ── /api/* (mutations, webhooks, PDF, exports)
          │
          ▼
Supabase (ap-south-1 Mumbai)
   ├── Postgres  ── RLS, triggers, pg_cron, full-text search
   ├── Auth      ── JWT, sessions, email
   ├── Storage   ── images, PDFs (later R2)
   └── Realtime  ── optional: live ops board, presence (Phase 2)
```

**Region pairing is a performance decision, not a detail.** Put Vercel functions in
`bom1` (Mumbai) and Supabase in `ap-south-1`. A round trip between them should be
single-digit milliseconds. A US-hosted database adds 200–250 ms to *every* query and
makes a 1.5-second quote screen impossible.

---

## 3. Data model and tenancy

### 3.1 Core tables

```
organisations        id, name, slug, plan, trial_ends_at, status, created_at
memberships          org_id, user_id, role, status, invited_by     (unique org+user)
businesses           org_id, name, logo_path, city, district, phone, email,
                     tax_mode, tax_rate, advance_pct, quote_validity_days,
                     currency, locale, published, brand_json
service_verticals    org_id, vertical_key, enabled, config_json
menu_items           org_id, name, category, unit, price_paise, veg, allergens[],
                     image_path, active, cost_paise (nullable: manual override)
recipes              menu_item_id, inventory_item_id, qty_per_guest, unit
                     (cost is derived from recipe when a recipe exists, otherwise
                      from the manual override; never both silently)
packages             org_id, name, rate_paise, min_guests, staff_per_100,
                     includes[], active
clients              org_id, name, phone (normalised), email, source, notes
enquiries            org_id, client_id, event_date, guests, event_type, message,
                     status, source, assigned_to, next_follow_up_at
events               org_id, client_id, enquiry_id, title, event_type, date,
                     start_time, venue_name, venue_address, lat, lng, guests,
                     package_id, status, notes
quotations           org_id, event_id, number, current_version_id, status,
                     valid_until, accepted_at, accepted_by
quotation_versions   quotation_id, version, snapshot_json, subtotal_paise,
                     tax_paise, total_paise, cost_paise, margin_paise,
                     content_hash, sent_at, sent_by
quotation_lines      version_id, kind, label, qty, unit, rate_paise, tax_rate,
                     amount_paise, cost_paise, sort_order
payments             org_id, event_id, quotation_id, amount_paise, mode,
                     gateway_ref, status, received_at, recorded_by, idempotency_key
documents            org_id, kind, storage_path, mime, bytes, sha256, created_by
availability_blocks  org_id, date, status (open | limited | blocked), reason
                     (capacity used is derived by counting events for the date,
                      never stored as a counter)
inventory_items      org_id, name, unit, stock_qty, threshold_qty, unit_cost_paise
stock_movements      org_id, item_id, delta_qty, reason, ref_type, ref_id, at
vendors              org_id, event_id, name, service, amount_paise, status
tasks                org_id, event_id, title, owner_id, due_at, status, priority
reviews              org_id, event_id, client_id, rating, text, published, reply
review_tokens        org_id, event_id, token_hash, expires_at, used_at
notifications        org_id, user_id, kind, payload_json, channel, status,
                     attempts, sent_at, read_at
subscriptions        org_id, plan, status, gateway_ref, current_period_end
usage_counters       org_id, period, quotes_created, users_active, storage_bytes
audit_events         org_id, actor_id, action, entity, entity_id, before, after, at
invitations          org_id, email, role, token_hash, expires_at, accepted_at
```

### 3.2 Rules that prevent the prototype's mistakes

1. **`org_id` on every tenant table, never nullable.** Composite indexes lead with
   `org_id`.
2. **Money is integer paise.** No floats, ever. Format at the edge of the UI.
3. **Totals are computed server-side** by one shared pure function used by both the
   API and the PDF renderer. The client may preview, but the stored total wins.
4. **A sent quotation is immutable.** Editing creates a new version; the old one is
   retained with its snapshot and a hash.
5. **Payments are append-only.** Corrections are reversing entries, not edits.
6. **Soft delete** (`deleted_at`) on business records; hard delete only through a
   documented erasure workflow.
7. **Optimistic concurrency**: every mutable row carries `version`; updates use
   `where version = $expected` and fail loudly on conflict.
8. **Idempotency**: webhook handlers and payment creation accept an idempotency key
   with a unique index.

### 3.3 Row-level security

Every table gets RLS enabled. The policy shape:

```sql
-- membership lookup, wrapped so the planner can cache it per statement
create or replace function is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

alter table events enable row level security;

create policy events_select on events for select
  using (is_org_member(org_id));

create policy events_write on events for all
  using (is_org_member(org_id) and has_role(org_id, array['owner','manager']))
  with check (is_org_member(org_id) and has_role(org_id, array['owner','manager']));
```

**Non-negotiables**

- Service-role key never reaches the browser. Only route handlers use it, and only
  after their own authorization check.
- Every RLS policy is tested by an automated two-tenant test: user B attempts read,
  insert, update and delete on user A's rows and must get zero rows or an error.
- The employee role cannot read finance tables even if a UI bug shows the link.
- Storage buckets are private; access is via short-lived signed URLs.

**Why this matters:** the prototype stores every org's data in the same browser and
hides screens with CSS. In a real product that would be a breach, not a bug.

---

## 4. Performance design

The target is Amazon/Swiggy-like *perceived* speed on a mid-range Android phone on 4G,
not a fast desktop demo.

### 4.1 Budgets (release gates)

| Metric | Target (p75, mobile) | Hard fail |
|---|---|---|
| TTFB, cached public page | < 200 ms | > 600 ms |
| TTFB, authenticated page | < 600 ms | > 1,200 ms |
| LCP, public profile | < 2.0 s | > 2.8 s |
| LCP, dashboard | < 2.5 s | > 3.5 s |
| INP | < 200 ms | > 500 ms |
| CLS | < 0.05 | > 0.15 |
| Initial JS, route entry | < 170 KB gzipped | > 250 KB |
| Quote screen interactive | < 1.5 s | > 2.5 s |
| Save-quote API p95 | < 300 ms | > 800 ms |
| DB query p95 | < 50 ms | > 150 ms |

Measured with Vercel Speed Insights/Web Vitals on a throttled profile (4G, 4× CPU
slowdown) and a real low-end device before each release.

### 4.2 Techniques, in order of payoff

1. **Render on the server.** The dashboard arrives as HTML with data, not a shell plus
   three client fetches. No `useEffect` data loading on first paint.
2. **Stream with Suspense.** Send the shell and the primary number immediately; stream
   the chart and recent activity.
3. **Cache public pages.** ISR with tag revalidation: a provider's profile is static
   HTML at the edge until their data changes. On publish/edit, call
   `revalidateTag('org:<id>')`.
4. **Cache per request.** Wrap repeated queries in React `cache()` to prevent the same
   organisation lookup four times per render.
5. **Select only what is shown.** No `select *` on list screens; explicit columns and
   limits.
6. **Paginate with cursors, not offsets.** `where (created_at, id) < ($1, $2)` stays
   fast at 100k rows; `offset 5000` does not.
7. **Index for the query you wrote.** Composite `(org_id, date)`, `(org_id, status)`,
   partial indexes for `status = 'pending'`, trigram index for client search.
8. **Avoid client-side chart libraries on first load.** Dynamic import the chart;
   render a static approximation until it loads.
9. **Images.** Client-side compress to WebP, max 1,600 px, target ≤120 KB, generate
   320 px thumbnails, always set width/height, `loading="lazy"`, `fetchpriority="high"`
   only for the hero.
10. **Fonts.** Two weights maximum, `font-display: swap`, self-host, subset Latin +
    Tamil only on Tamil routes.
11. **Prefetch on intent.** Prefetch the quote route when the pointer touches "New
    quote"; on mobile, prefetch after idle.
12. **Optimistic UI for checkboxes and small edits**, with rollback on failure. Never
    optimistic for money.
13. **Keep the quote composer client-side interactive but the totals authoritative.**
    Compute a preview in a web worker if it grows; do not round-trip per keystroke.
14. **Service worker** caches the app shell and the last 20 viewed records; quote
    drafts queue in IndexedDB and sync when online.

### 4.3 Database performance rules

- Every multi-row write is a transaction; no partial quotes.
- Avoid N+1: one query with joins or a lateral, not a loop.
- `EXPLAIN ANALYZE` any query that touches more than 5,000 rows before shipping.
- Keep the hot tables (`events`, `quotations`, `payments`, `enquiries`) under 10M rows
  per region for the first three years; partition by year when approaching it.
- No triggers that call external services. Jobs do that.
- Vacuum/analyse defaults are fine at this scale; monitor bloat quarterly.

---

## 5. Free-tier reality check (official limits, October 2026)

### Supabase Free

| Resource | Limit | Consequence for us |
|---|---|---|
| Database | 500 MB | ~400–700 active businesses at ~0.8 MB each for 12 months, before bloat |
| Egress | 5 GB/month | The binding constraint if images are served from Storage |
| Cached egress | 5 GB/month | Helps only with CDN caching configured |
| Storage | 1 GB | ~1,200 businesses at 700 KB of compressed images each |
| Auth MAU | 50,000 | Not a constraint for years |
| Realtime | 200 concurrent, 2M messages/month | Enough for a pilot, not for live ops at scale |
| Edge Functions | 500k invocations | Not used by this design |
| Projects | 2 active | One production, one development — no staging unless we pause one |
| Backups | **None** | Must export nightly ourselves |
| Pausing | After 1 week of inactivity | A pilot with real users stays active; a demo may pause |

### Vercel Hobby

| Resource | Limit | Consequence |
|---|---|---|
| Fast data transfer | 100 GB | Fine for ~100k page views of a lean page |
| Fast origin transfer | 10 GB | The real limit; cache aggressively |
| Function invocations | 1M/month | ~30k quote saves plus page renders; monitor |
| Provisioned memory | 360 GB-hours | Fine if functions stay small and fast |
| Active CPU | 4 hours/month | Tight if PDFs or exports run long; move PDFs to a queue or Supabase |
| Image transformations | 5,000/month | Compress at upload, not on request |
| Cron | 100 jobs, minimum daily | Enough for reminders and nightly backups |
| Commercial use | Hobby is intended for personal, non-commercial projects | **Paying customers likely require Pro at $20/month** |

**Budget honesty:** the research could not fetch Vercel's fair-use page directly, so
treat "Hobby is non-commercial" as provisional but plan for it. The first rupee of
revenue should be accompanied by a $20 Vercel Pro upgrade. If the rule is enforced
and zero spend is absolute, the fallback is Cloudflare Pages/Workers (commercial use
allowed on the free plan) while keeping Vercel for previews. That is a hosting change,
not an architecture change, because the app is standard Next.js.

### Capacity model (ASSUMPTION, to be replaced by measurement)

| Stage | Active businesses | DB | Storage | Egress/mo | Binding limit |
|---|---|---|---|---|---|
| 0 (build/demo) | 0–5 design partners | < 20 MB | < 20 MB | < 1 GB | None, but free-tier pausing applies |
| 1 (first paying customer) | 5–100 | ~50 MB | ~70 MB | ~1.5 GB | Supabase egress, Vercel origin transfer |
| 2 | 100–300 | ~150 MB | ~200 MB | ~3 GB | Supabase egress |
| 3 | 300–600 | ~300 MB | ~400 MB | ~5 GB | **Supabase free egress** |
| 4 | 600–1,000 | ~450 MB | ~700 MB | ~8 GB | **DB size and egress** |

Assumptions: 0.5–0.8 MB of database per business per year; 6 images at 110 KB plus one
logo; 400 public page views per business per month at ~250 KB transferred. These are
rough; instrument actual usage from week one.

### Cost ladder

| Stage | Services | Monthly cost |
|---|---|---|
| 0 — build, demo, design partners | Vercel Hobby, Supabase Free, Resend Free, Sentry Free | **₹0** (domain is the only cash cost, ≈₹800/year) |
| 1 — first paying customer | Vercel Pro $20 + Supabase Pro $25 + email + domain | **≈₹5,500** |
| 2 — 100–300 businesses | + Supabase compute add-on, R2, Sentry team, WhatsApp Cloud API | **≈₹12,000–18,000** |
| 3 — 300–1,000 | + read replica, queue, support tooling | **≈₹35,000–60,000** |
| 4 — 10k businesses | + regional replicas, search cluster, on-call | **≈₹1.2–2.5 lakh** |

**Correction to the "₹0 production" idea:** Supabase Free pauses a project after
seven days of inactivity and ships **no backups**. That is acceptable for a demo or a
consented design-partner pilot, and unacceptable for a paying customer's quotation
history. Therefore the paid step is **at the first paying customer**, not at 50 or 300.
The genuine zero-cost window is build + demo + pilot, and it is roughly 8–12 weeks.

**Pre-launch cash prerequisites (not infrastructure):** domain (~₹800/year), a
registered business entity for Razorpay KYC if not already available, a CA
consultation on GST, and possibly WhatsApp Business verification later. These are
₹0/month but not ₹0 total. List them before promising anyone a free launch.

At 1,000 businesses paying a blended ₹650, revenue is ₹6.5 lakh/month and
infrastructure is under 3% of it. The model works if churn does.

### Migration triggers (numeric, not vibes)

| Trigger | Threshold | Action |
|---|---|---|
| Supabase DB | > 70% (350 MB) | Archive old events to cold storage; upgrade to Pro (8 GB) |
| Supabase egress | > 70% (3.5 GB/mo) | Move images to Cloudflare R2 (10 GB free, zero egress); add cache headers |
| Supabase storage | > 70% (700 MB) | R2 move, or Pro (100 GB) |
| Vercel origin transfer | > 70% (7 GB) | Increase ISR windows, move images off Vercel, audit cache misses |
| Function CPU | > 70% (2.8 h) | Move PDFs/exports to background jobs; reduce bundle |
| DB p95 query | > 100 ms | Add index, rewrite query, then consider compute add-on |
| Auth MAU | > 35,000 | Plan upgrade; not a near-term concern |
| Free-tier inactivity | 7 days without traffic | Never point a paying customer at a Free project; upgrade at first revenue |
| Realtime connections | > 150 | Pro, or move live ops to polling |

**Rule:** upgrade on a measured trigger, never preemptively "just in case", and never
in the middle of a release.

---

## 6. Security and compliance baseline

- TLS everywhere; HSTS; secure, http-only, same-site cookies.
- CSRF protection on mutations; origin checks on route handlers.
- Rate limits per IP and per user on auth, enquiry, quote send and payment creation.
  Store counters in Postgres at low volume; move to Upstash when it hurts.
- Password rules and breach-list check at signup; magic link as the default for
  low-friction onboarding.
- Webhook signature verification (Razorpay) plus idempotency.
- Signed URLs for all private files, 10-minute expiry.
- PII minimisation: no Aadhaar, no PAN, no card data ever touches us (gateway hosted).
- Audit log for money, permissions, exports, deletion.
- Data export and deletion workflows (India's DPDP Act 2023 direction; confirm current
  rules with counsel before launch).
- Sentry scrubbing for phone numbers and emails before events leave the server.
- Dependency scanning and pinned versions; no postinstall scripts from unknown packages.

---

## 7. Observability

| What | Tool | Alert condition |
|---|---|---|
| Frontend errors | Sentry browser | New issue in production, any user |
| Server errors | Sentry Node | Error rate > 1% over 5 min |
| Web Vitals | Vercel Speed Insights | LCP p75 > 2.8s for 1 hour |
| Slow queries | Supabase logs + `pg_stat_statements` | p95 > 150 ms |
| Failed payments | Razorpay webhook log + our `payments.status` | Any failed capture not retried in 10 min |
| Cron failures | Vercel cron logs | Any missed run |
| Uptime | External ping (free) | 2 consecutive failures |
| Cost | Provider dashboards, weekly check | 70% of any free-tier limit |

Every log line carries `request_id`, `org_id`, `route` and `duration_ms`. No phone
numbers, emails or quote contents in logs.

---

## 8. Backups, restore and the free tier

Supabase Free includes **no backups**. That is unacceptable for a product that holds
someone's quotation history, even at zero budget.

**Plan:**
1. Nightly `pg_dump` (schema + data, compressed) via a GitHub Actions scheduled job
   (cloud, no local disk), uploaded to a private R2 bucket or a second storage
   provider. Keep 30 daily and 12 monthly.
2. Nightly file manifest; storage objects copied weekly.
3. A documented restore drill every quarter: restore into the dev project, run a row-
   count and checksum comparison, record the time taken.
4. Before any destructive migration: snapshot, verify, then migrate.

If the restore drill has never been run, we do not have backups. We have files.

---

## 9. Path off the free tier without a rewrite

The design deliberately uses boring, portable pieces:

| Lock-in risk | Mitigation |
|---|---|
| Supabase | Standard Postgres; auth is the only proprietary piece. Keep user ids in our `memberships` table so auth can be swapped. |
| Vercel | Standard Next.js; `output: 'standalone'` runs on any Node host or container. |
| RLS | SQL, portable to any Postgres. |
| Storage | Paths and metadata in our `documents` table, bytes in a bucket; move buckets without touching records. |
| Payments | Gateway references stored, not gateway-specific objects; adapters per provider. |

Scale path when one database is not enough: read replica for public/search reads →
partition hot tables by year → move analytics and search to dedicated stores → shard by
region (India South, India North) with `org_id` routing. None of these require changing
the application's data contracts.
