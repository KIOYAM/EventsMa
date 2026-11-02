# 10 — Hosting, Supabase and cost competitiveness

**Verified:** 2 November 2026 against vendor pricing pages and independent 2026 reviews.
Prices move. Re-check before purchase; every number below is a planning figure, not a quote.

---

## 1. The short answer

For this product the honest ladder is:

| Stage | Stack | Monthly |
|---|---|---|
| Demo, design partners, no customer money | Vercel Hobby + Supabase Free | **₹0** (domain ≈ ₹800/yr) |
| First paying customer | Vercel Pro + Supabase Pro | **≈₹4,000–4,400** ($45 at ≈₹88–97) |
| 300–600 businesses | + R2 for media, compute add-on | ≈₹12,000–18,000 |
| 1,000+ | read replica, queue, support tooling | ≈₹35,000–60,000 |

The "fully free forever" option does not exist for a product that holds someone's
quotation history, and the two constraints that break it are specific:

1. **Supabase Free has no automated backups and pauses a project after one week of
   inactivity.** Losing a caterer's quote history is an unrecoverable trust event.
2. **Vercel Hobby is explicitly personal, non-commercial.** Charging a customer on Hobby
   is a terms violation, not a grey area.

So ₹0 is a *build and demo* budget, not a production budget. Plan the paid step at the
first rupee of revenue, exactly as `docs/04 §5` already states.

---

## 2. What the free tiers actually include

### Supabase Free

| Resource | Limit | What it means here |
|---|---|---|
| Database | 500 MB | ~400–700 active businesses at ~0.8 MB/year each, before bloat |
| Storage | 1 GB | ~1,200 businesses at 700 KB of compressed images |
| Egress | 5 GB/mo | The binding constraint once photos are served from Storage |
| Auth | 50,000 MAU | Not a constraint for years |
| Backups | **None** | Nightly `pg_dump` must be built by us, or upgrade |
| Idle behaviour | **Pauses after 7 days** | A pilot stays warm; a demo project dies quietly |
| Projects | 2 active | Production + development only; no separate staging |

### Supabase Pro — $25/month

Everything in Free plus 8 GB disk per project, 250 GB bandwidth, 100,000 MAU,
**daily backups with 7-day retention**, no pausing, and email support. Extra storage is
billed around **$0.125/GB**. Compute add-ons are separate and are what actually moves the
bill at scale, not the base $25.

### Vercel Hobby → Pro

Hobby is free and restricted to **personal, non-commercial** use; Vercel's own docs and
every 2026 pricing review say the same. Pro is **$20 per seat per month with a $20 usage
credit**, and it is the plan commercial use requires. Beyond the base, cost is driven by
bandwidth, function invocations, and CPU time — the last one matters because PDF rendering
is CPU, not request count.

### Cloudflare, for the zero-cost purist

Workers' free plan **does allow commercial use**, and R2 charges no egress. The catch is
technical, not legal: Workers Free caps CPU per request at roughly 10 ms, which is too
tight for server-side PDF rendering, and running Next.js there needs the OpenNext adapter.
It is a legitimate path to near-zero hosting, but it costs engineering weeks and it moves
you off the framework's first-class deployment target.

---

## 3. Competitiveness against the product's own price

At ₹499/month Growth:

| Metric | Value | Verdict |
|---|---|---|
| Infrastructure at first paying customer | ≈₹4,200/mo | Break-even at ~9–10 customers on a ₹450 gross margin |
| Infrastructure per active business at 300 tenants | ≈₹13/mo | 2.6% of revenue — healthy |
| Infrastructure as % of revenue at 1,000 tenants | under 3% | Not the constraint |
| Payment fee on ₹499 (2% + GST) | ≈₹12 | Fine; would not be at ₹99 |

Compared with the market documented in `docs/01 §4` — JUCAS at ₹8,000/year renewal,
CateringMenu at ₹4,999/year — a ₹499/month plan is **₹5,988/year**, i.e. mid-market. Hosting
does not decide whether that is competitive; the margin view and the 90-second quote do.
Hosting only decides whether the business survives long enough to find out.

**The real risk is churn, not the ₹4,200.** At 5% monthly churn a catering SaaS pays for
infrastructure and nothing else. This is why `docs/07 §2` tracks monthly logo churn as the
single most important number.

---

## 4. Options compared

| Option | Free tier | Paid entry | Fit for EventsMa | Main risk |
|---|---|---|---|---|
| **Vercel + Supabase** (current) | Hobby + Free | ≈$45/mo | Best: Next.js-native, Postgres + Auth + Storage in Mumbai, RLS in SQL | Two vendors; both must upgrade at once |
| Cloudflare Workers + R2 + external Postgres | Commercial use allowed | Near $0 at low volume | Strong if PDF moves to a queue or a separate service | 10 ms CPU cap, OpenNext adapter, more moving parts |
| Single VPS (Hetzner-class) + managed Postgres | None | ≈$5–15/mo | Cheapest at 50+ tenants | You own patching, backups, TLS, uptime, on-call |
| Railway / Render-style PaaS | Trial credits | ≈$10–25/mo | Simple Next.js hosting, but no Mumbai Postgres guarantee | Less mature India region; pricing per resource |
| Neon (Postgres) + Vercel | Generous branching | Usage-based | Excellent branching for previews; auth and storage are separate vendors | Three vendors instead of two |

The current stack wins on **time-to-correctness**, not on lowest possible bill. If the
constraint becomes "₹0 with paying customers", the migration is Cloudflare for compute and
an external Postgres — the schema, Drizzle and SQL policies move unchanged, which is why
`docs/04 §9` kept those portable.

---

## 5. Region and latency

- Supabase `ap-south-1` (Mumbai) and Vercel `bom1` keep the app-to-database round trip in
  single-digit milliseconds.
- A US-hosted database adds 200–250 ms per query and makes the 1.5-second quote screen
  impossible. This is the one hosting decision that is not reversible by paying more later.
- Public profile pages should be ISR-cached at the edge; a cached page never reaches
  Mumbai at all, which is what keeps LCP under 2 s on 4G.

---

## 6. Upgrade triggers, not dates

| Trigger | Threshold | Action |
|---|---|---|
| First paying customer | any revenue | Supabase Pro + Vercel Pro together |
| Database | > 70% of plan | archive cold events, then upgrade |
| Egress | > 70% of plan | move media to R2 |
| Storage | > 70% of plan | R2, or Pro |
| PDF CPU | > 70% of allowance | move PDF to a background job |
| DB p95 query | > 100 ms | index first, compute add-on second |
| Realtime connections | > 150 | Pro, or poll instead |
| Any 7-day traffic gap on Free | — | never point a paying customer at a Free project |

---

## 7. What to verify before buying anything

1. Supabase pricing page: Free limits, Pro $25, backup retention, compute add-on prices.
2. Vercel pricing page: current Hobby commercial-use wording and Pro seat price.
3. Cloudflare Workers limits: CPU per request on Free, and R2 egress policy.
4. Confirm the Supabase project region is `ap-south-1` **before** creating data. Moving
   regions later is a migration, not a setting.
5. Ask a CA about GST on the software subscription before the first invoice.

**Sources consulted (2 Nov 2026):** supabase.com/pricing; vercel.com/pricing and
vercel.com/docs/plans/hobby; 2026 pricing reviews on uibakery.io, makerkit.dev,
activepieces.com, metacto.com; morphllm.com comparison of Workers vs Vercel.

---

## 8. Recommendation

Keep Vercel + Supabase. Pay at the first customer. Do not spend a week moving to
Cloudflare to save ₹4,000 while a paying caterer waits — the engineering time costs more
than the hosting, and the migration is available later precisely because nothing in the
data layer is vendor-specific.
