# 07 — Roadmap, Metrics, Risks

**Team assumption:** one full-time developer plus a founder doing sales and design
review. Every estimate below assumes that, and doubles if either is part-time.

---

## 1. Phases

### Phase 0 — Validate before building (weeks 1–2)

| Work | Output |
|---|---|
| Interview 5 caterers, watch them quote | Written notes, real quotes with numbers redacted |
| Test the 10-minute demo script on paper | List of steps they cannot follow |
| Confirm pricing reaction at ₹499 and ₹999 | 3 of 5 say yes or give a reason |
| Reconcile market-size claims | One defensible sentence for the pitch |
| Confirm manual payment flow and GST treatment with a CA | Written answer |
| Set up accounts: Vercel, Supabase (Mumbai), Resend, Sentry | Working dev environment |

**Exit criteria:** 3 of 5 caterers would pay; the demo script survives contact;
infrastructure accounts exist at ₹0.

**Kill gate:** if 0 of 5 see the value, stop and return to [03](03-ideation-and-mvp.md).

---

### Phase 1 — MVP-1 (weeks 3–10)

| Week | Build |
|---|---|
| 3 | Schema, migrations, RLS, auth, org/membership, two-tenant test |
| 4 | Business profile, settings, tax/advance/validity, file upload with compression |
| 5 | Menu and packages, units, images, activation checklist |
| 6 | Quote composer, pricing engine with property tests, draft save |
| 7 | Quote send: numbering, version, token, PDF, WhatsApp share |
| 8 | Customer quote view, acceptance, manual bank/UPI instructions, receipt recording |
| 9 | Public provider page (ISR, SEO), enquiry delivery, dashboard |
| 10 | Margin view, export, empty states, mobile polish, performance pass |

**Exit criteria**

- 10-minute demo script passes on a real mid-range Android phone.
- Two-tenant isolation suite green.
- LCP p75 < 2.5 s on the public page; quote screen interactive < 1.5 s.
- One real caterer completes a real quote unaided.
- Nightly backup running and one restore drill completed.

---

### Phase 2 — Pilot and first revenue (weeks 11–18)

| Work | Why |
|---|---|
| 5 design partners onboarded, weekly feedback | Replace guesses with evidence |
| Subscription billing, trial, plan limits, GST invoice | Start charging |
| Follow-up queue and reminders | Retention |
| Calendar availability and conflicts | Prevents the worst operational failure |
| Staff assignment with conflict check | Operations value |
| Tamil UI for field roles | Real adoption |
| PWA offline drafts and check-ins | Venue reality |
| Support runbook + 3 short videos | Reduce onboarding minutes |

**Exit criteria:** 3 paying customers; activation (quote sent in first 24 h) above 60%;
support under 30 minutes per new customer; churn measurable.

---

### Phase 3 — Depth that earns Pro (weeks 19–30)

Inventory with event requirement explosion; purchase list and stock movements; vendor
ledger; receivables ageing; reports; CSV/XLSX import; review collection; distance-based
transport with cache and manual override; multi-user permissions beyond the base roles;
second service vertical deeply supported (decor or photography).

**Exit criteria:** 15–25 paying customers; Pro plan chosen by at least 40%; infra cost
per tenant under ₹40/month; p75 LCP unchanged as data grows.

---

### Phase 4 — Discovery, only if supply density exists

Gate: 30+ verified, responsive providers in one city, with real availability and
response times under 4 hours. Until then, public pages only.

Then: marketplace search with availability filters, quote comparison for customers,
provider response SLAs, reviews with verification, maybe lead fees. Never before the
gate — a thin marketplace damages the caterer's reputation and ours.

---

## 2. Metrics

### North star

**Quotes sent per active business per week.** It measures whether the product is part
of the daily workflow, not whether someone signed up.

### Funnel

| Stage | Metric | Target (first 6 months) |
|---|---|---|
| Acquisition | Signups per week | 10 |
| Activation | % who send a quote within 24 h | > 60% |
| Time to first quote | Median minutes from signup | < 20 |
| Habit | Quotes sent per active business per week | > 3 |
| Conversion | Trial → paid | > 25% |
| Retention | Monthly logo churn | < 3% |
| Revenue | Blended ARPU | > ₹600 |
| Referral | % signups from referral | > 20% by month 6 |

### Product quality

| Metric | Target |
|---|---|
| p75 LCP, public page | < 2.0 s |
| p75 LCP, dashboard | < 2.5 s |
| Quote screen interactive | < 1.5 s |
| p95 save-quote API | < 300 ms |
| Error rate | < 0.5% of requests |
| Failed payments unresolved > 1 h | 0 |
| Restore drill | Passed quarterly |

### Cost

| Metric | Target |
|---|---|
| Infrastructure per active business | < ₹40/month at 300 businesses |
| Support minutes per new customer | < 30 |
| Cost as % of revenue | < 10% at 50 customers |

### Instrumentation rules

- Every flow in [06](06-product-flows.md) emits `started`, `succeeded`, `failed` with a
  reason code.
- No PII in analytics. Use organisation id, never phone or email.
- A metric that nobody reviews weekly is deleted. Dashboards rot.

---

## 3. Risk register

Likelihood × impact, each with a trigger that forces action.

| # | Risk | L | I | Trigger | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Caterers do not pay | H | H | 0 of 5 convert | Re-price, re-target larger businesses, or pivot to operations | Founder |
| R2 | Churn from seasonality | H | H | > 5%/month | Annual plans, pause option, lean-season features | Founder |
| R3 | Tenant data leak | L | H | Any finding in the RLS suite | RLS by default, two-tenant tests, no service key in client, audit | Dev |
| R4 | Data loss | L | H | Any restore failure | Nightly export, quarterly drill, soft delete | Dev |
| R5 | Wrong quote maths | M | H | Any mismatch between preview and server | Single pure engine, property tests, server authority | Dev |
| R6 | Free-tier limit hit mid-season | M | M | 70% of any limit | Alerts at 70%, upgrade runbook, image offload to R2 | Dev |
| R7 | Vercel Hobby commercial-use enforcement | M | M | Any notice or throttle | Budget $20 Pro at first revenue; Cloudflare fallback planned | Dev |
| R8 | WhatsApp policy or pricing change | M | M | API announcement | `wa.me` links are provider-independent; email always works | Dev |
| R9 | Support load exceeds capacity | M | M | > 30 min per customer | Videos, checklist, in-app help, cap weekly onboarding | Founder |
| R10 | Competitor copies the quote screen | M | L | Feature parity in a demo | Compete on data, speed and regional templates | Founder |
| R11 | Payment reconciliation errors | M | H | Any unmatched payment | Idempotency, webhook replay, daily reconciliation job | Dev |
| R12 | Scope creep into marketplace/ERP | H | M | Any epic outside MVP list | Written non-goals; roadmap gate for Phase 4 | Founder |
| R13 | Single developer bus factor | M | H | Illness or absence | Docs, migrations, runbooks, no undocumented decisions | Dev |
| R14 | Legal/compliance gap (GST, DPDP) | M | M | First GST invoice or erasure request | CA review, consent, export/delete flows | Founder |
| R15 | Disk constraint disrupts the build | M | M | Any install writing to C: | `.npmrc`, env vars, no Docker, weekly disk check | Dev |

---

## 4. Decision log (ADRs)

Short, dated, revisitable. Add a new entry rather than editing history.

| ID | Date | Decision | Reason | Revisit if |
|---|---|---|---|---|
| ADR-001 | 2026-10-24 | Strategy A: quote-first wedge | Only option that can produce revenue inside the budget | Margin view does not change behaviour |
| ADR-002 | 2026-10-24 | Next.js + Vercel + Supabase | Fast to ship, SSR for SEO, Postgres + RLS for tenancy, free tier | Costs exceed 10% of revenue, or Vercel blocks commercial use |
| ADR-003 | 2026-10-24 | Integer paise, server-authoritative totals | Money bugs are fatal to trust | Never |
| ADR-004 | 2026-10-24 | RLS as the tenancy boundary | Prevents the prototype's class of leak | Never; only the implementation may change |
| ADR-005 | 2026-10-24 | No Docker locally | Disk constraint on C: | Disk freed, or CI cannot reproduce |
| ADR-006 | 2026-10-24 | WhatsApp via `wa.me` first | Zero cost, no approval, owner's own number | Volume justifies Cloud API and templates |
| ADR-007 | 2026-10-24 | Immutable sent quotes, versioned edits | Disputes need evidence | Never |
| ADR-008 | 2026-10-24 | Public pages only, no marketplace | No supply density; protects trust | 30+ verified providers in one city |
| ADR-009 | 2026-10-24 | Free tier capped at 5 quotes/month, no margin view | Competitors give quote tools away; we must match entry, not the differentiator | Free users never convert |
| ADR-010 | 2026-10-24 | No AI pricing in MVP | A wrong number costs a real contract | Deterministic engine trusted for 3 months |

---

## 5. Questions only real caterers can answer

Ask these in Phase 0. Do not build on guesses.

1. Show me the last quote you sent. How long did it take, and what did you use?
2. Which part of that quote did you calculate in your head?
3. How do you decide the transport charge for a venue 40 km away?
4. When paneer costs ₹40 more per kg, what changes in your price, and when?
5. How many enquiries do you get in a month, and how many become bookings?
6. Where do enquiries come from, and where do you lose them?
7. What do you do the day before an event? The morning of?
8. How do you know whether an event made money?
9. Who else needs to see the quote or the event details?
10. What do you use on your phone today? Would you fill a form on it at a venue?
11. What would make you stop using a notebook?
12. What do you pay for software today, and for what?
13. If this cost ₹499 a month, what would it have to do to be worth it?
14. What happens when a customer changes the guest count a week before?
15. What is the most expensive mistake you made last year?

Record verbatim answers. They are more valuable than any market report.

---

## 6. First two weeks, concretely

| Day | Task |
|---|---|
| 1 | Create Vercel/Supabase/Resend/Sentry accounts; local env without touching C: |
| 2 | Schema v1 migration; RLS policies; two-tenant test skeleton |
| 3–4 | Auth, org creation, membership, route guards |
| 5 | Business profile + settings + upload |
| 6–7 | Five caterer interviews (two in person) |
| 8 | Revise MVP scope from interview notes; update this doc |
| 9–10 | Menu and packages with units and images |
| 11–12 | Pricing engine + property tests |
| 13–14 | Goldfish review of the quote design; fix; publish design doc |
