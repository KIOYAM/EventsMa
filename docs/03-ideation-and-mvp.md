# 03 — Ideation and MVP

**Method:** Elephant-Goldfish Model (Google, Apache-2.0 plugin installed in
`.agents/skills/egm-*`). The Elephant (this document set) holds intent and context.
Goldfish reviewers with no shared context attack it. The review is in
[`reviews/2026-10-24-elephant-self-review.md`](reviews/2026-10-24-elephant-self-review.md)
— a self-review, because this harness had no file-reading subagent for an independent
Goldfish pass.
The entity map from the graphify method is in [08](08-knowledge-graph.md).

**Rule for this document:** lead with the weakest part of each option, not the
strongest. An option that survives its own counter-argument is worth building.

---

## 1. The three strategies on the table

### Strategy A — Quote-first wedge (recommended)

A mobile-first tool that turns a WhatsApp enquiry into a priced, branded, sendable
quote in under 90 seconds, and shows the owner the margin before they send it. Public
profile page included. Operations and inventory grow out of the same event record.

- **Who pays:** owner-caterer, ₹499/month after a free tier.
- **Time to first value:** one sitting, under 20 minutes.
- **Build cost to first revenue:** ~6–8 weeks of one focused developer.
- **Weakest point:** it is a feature, not a platform. A free competitor can copy the
  screen. Defensibility comes later from data and workflow, not from the quote form.

### Strategy B — Marketplace-first

Aggregate demand, let customers compare caterers, take a commission or lead fee.

- **Who pays:** the caterer per lead, or the customer per booking.
- **Time to first value:** never, until supply density exists.
- **Build cost:** 6+ months plus a sales team and a trust/moderation operation.
- **Weakest point:** classic chicken-and-egg with zero budget. A marketplace with 5
  caterers in one city is worse than Google. The prototype already looks like one,
  which is a trap, not a head start.

### Strategy C — Full operations ERP

Bookings, ingredient explosion, purchases, staff, payroll, accounts, multi-branch.

- **Who pays:** larger caterers (₹15 lakh+/year revenue).
- **Time to first value:** weeks of data entry.
- **Build cost:** 6+ months, and you are competing with JUCAS at ₹8,000/year renewal.
- **Weakest point:** broad surface, thin value per screen, brutal onboarding. The
  prototype's operations board is good, but it is not the reason someone switches.

### Scoring

Weights reflect a zero-budget, one-team, need-revenue-soon reality.

| Criterion (weight) | A | B | C |
|---|---|---|---|
| Time to first paying customer (25) | 5 | 1 | 2 |
| Buildable by a small team (20) | 4 | 2 | 2 |
| Willingness to pay proven by competitors (15) | 4 | 3 | 5 |
| Differentiation (15) | 3 | 4 | 2 |
| Survives seasonality (10) | 3 | 4 | 4 |
| Capital efficiency (10) | 5 | 1 | 2 |
| Defensibility after 12 months (5) | 3 | 5 | 3 |
| **Weighted total / 100** | **79** | **45** | **55** |

**DECISION — build A, with C's event record as the second act.** Not because it is the
biggest idea, but because it is the only one that can produce a paying customer before
the budget runs out.

**Strongest counter-argument to A:** "Quote tools are commodities; CateringMenu gives
one away free, and the owner's real pain is getting customers, not formatting a
quote." This is partly right. The answer is not to out-feature the free tool; it is to
be measurably faster on a phone and to answer the one question the free tool does not:
*will I make money on this event?* If design partners do not react to the margin view,
A collapses to a commodity and we should move to C for larger businesses instead.

---

## 2. Product principles

1. **Ninety seconds to a quote.** Every extra field must justify itself against that
   number.
2. **The phone is the product.** Desktop is a convenience. Design at 360 px first.
3. **Never surprise with a number.** Show the arithmetic, always. Owners forgive a
   high price, not an unexplained one.
4. **WhatsApp is the delivery layer.** Do not fight it; generate the message for it.
5. **Free must be embarrassing to outgrow, not crippled.** 5 quotes/month, unlimited
   clients, full quote quality and no watermark. Pay for team, margin, payments and
   operations. Free must not be so generous that a working caterer never needs more.
6. **Data in, data out.** Export everything, any time. This is a sales argument.
7. **No fake data in production.** Demo mode is a separate, labelled environment.
8. **Performance is a feature, measured in the field.** Budgets in
   [04](04-architecture-cost-and-scale.md) are release gates.
9. **Every screen answers "what do I do next?"** One primary action.
10. **The customer's view is part of the product.** A quote the family cannot
    understand is a failed quote.

---

## 3. Ideas worth testing (cheap, before building)

Each is a real experiment, not a feature request. Sorted by cost to learn.

| # | Idea | Experiment | Cost | What would make us build it |
|---|---|---|---|---|
| 1 | **Quote from WhatsApp in one paste** — paste an enquiry message, extract date/guests/occasion | Wizard-of-Oz: do it manually for 10 enquiries, measure time saved | 2 days | Extraction is right 8/10 times and saves >2 minutes |
| 2 | **Margin guardrail** — warn when a quote falls below a target margin | Show a paper mock to 5 owners; ask if it changed their price | 1 day | 3/5 say they would change the price |
| 3 | **Shareable family plan link** — customer-side page comparing two quotes | Fake-door link from a real quote | 3 days | >30% of quote recipients open it |
| 4 | **"Copy last wedding"** | Time a repeat quote with and without duplication | 1 day | Saves >60 seconds per quote |
| 5 | **Tamil/Hindi field mode** | Test with 3 field employees | 2 days | They complete a check-in unaided |
| 6 | **Voice note to quote** | Manual transcription for 5 enquiries | 2 days | Accuracy and time beat typing |
| 7 | **Seasonal pause** instead of cancel | Offer to 3 lapsed prospects | 0 | They return next season without a new sale |
| 8 | **Price benchmark** "caterers near you charge ₹X–Y per plate" | Survey owners with a printed range | 1 day | Owners ask for it unprompted |
| 9 | **Vendor confirmation link** — vendor taps to confirm availability | One real event, manual links | 2 days | Vendor actually taps it |
| 10 | **Deposit-first booking** — customer pays advance from the quote page | One real quote with a payment link | 2 days | Customer pays without a phone call |

Ideas 1, 2 and 3 are the highest-leverage: they attack speed, differentiation and
trust at the same time.

---

## 4. MVP scope

**Goal:** a caterer can sign up, add a menu, create a quote, send it, and see the
margin, on a phone, without help. Everything else waits.

### Build sequence (reality-checked)

The eight-week plan in [07](07-roadmap-metrics-risks.md) is optimistic for one
developer. The de-risked order is:

1. Auth + tenancy + business profile (foundation, nothing visible)
2. Menu + packages + pricing engine with tests
3. Quote composer + share link + PDF
4. Margin view
5. Payment link + webhook + receipt
6. Public page + enquiry delivery
7. Dashboard + export + polish

If a week slips, cut **public page and enquiry delivery** to Phase 2. Do not cut
tenancy tests, pricing tests, or the payment reconciliation.

### Must ship (MVP-1)

| Area | Included | Acceptance test |
|---|---|---|
| Auth | Email + password, email verification, magic link, password reset, one organisation per signup | A new user verifies, signs in on a second device, sees the same data |
| Tenant isolation | Organisation id on every row, RLS policies, two-tenant test in CI | User B cannot read or write any of User A's rows, proven by an automated test |
| Business profile | Name, logo, city, phone, service areas, tax settings, advance %, quote validity | Completing it unlocks the quote composer |
| Menu | Dishes with price, unit (per guest/per tray/per counter), category, veg/non-veg, allergens, photo, active flag | 20 dishes added in under 10 minutes with import or manual entry |
| Packages | Name, rate, min guests, inclusions, staff-per-100 | Quote can use a package or a custom selection |
| Clients + enquiries | Create client, create enquiry, convert to event | Converted enquiry keeps its source and message |
| Quotation | Line items, package + extras, discount, transport, per-line tax, round-off, server-computed totals, PDF/link, expiry, version 1 | Total on screen equals total in the PDF equals total in the database |
| Share | WhatsApp message + link, copy link, PDF download, print | Sent from a phone in 3 taps |
| Margin | Dish cost from recipe/ingredient prices, quote contribution and margin %, warning below target | Owner can see cost and margin for every quote line total |
| Payments | Advance rule, Razorpay payment link, webhook updates ledger, receipt | Test-mode payment moves the balance and writes an immutable payment row |
| Public page | One page per business: services, packages, gallery, contact, enquiry | Indexable URL, LCP < 2.5s on 4G, enquiry delivered |
| Enquiry delivery | Email to owner + WhatsApp deep link + customer confirmation | Owner receives within 60 seconds; customer sees confirmation |
| Dashboard | Today, upcoming events, quotes awaiting response, money due | Every number links to the list that produced it |
| Export | Full data export (CSV per entity + JSON) | A caterer can leave with their data |

### Should ship (MVP-2, after first 10 paying customers)

Calendar availability and conflict warnings; follow-up queue; staff assignment with
conflicts; inventory with event requirement explosion; PWA offline drafts; CSV import;
Tamil UI for field roles; review collection after event; reports and receivables ageing.

### Will not ship in MVP

Marketplace search, comparisons, commissions, consumer app, multi-branch, payroll,
full accounting, AI menu generation, 20 verticals, custom domains, API, white label,
loyalty, gift cards, equipment rental marketplace.

### Explicit non-goals and why

| Non-goal | Reason |
|---|---|
| Consumer marketplace | No supply density; burns the budget; damages trust |
| Full accounting | Regulatory surface; integrate/export instead |
| AI pricing suggestions | A wrong number destroys credibility; deterministic first |
| Native mobile apps | PWA is enough until retention is proven |
| 20 verticals at launch | Catering deeply beats everything shallowly |

---

## 5. The 10-minute demo script

This is the acceptance script for MVP-1. If any step fails, the build is not ready.

1. **0:00** Open the site on a phone. Sign up with Google or email.
2. **1:00** Add business name, city, phone, upload logo. Skip everything optional.
3. **2:30** Add three dishes with prices and units. Add one package using two of them.
4. **4:00** New quote: pick client "Mehta family", 250 guests, 12 Feb, venue.
5. **5:00** Select the package, add a live counter, see the line items and total.
6. **6:00** See cost and margin. Change the price and watch margin move.
7. **7:00** Save, preview the quote on a phone-sized page, send on WhatsApp.
8. **8:00** Open the customer link: itemised, branded, accept + pay advance.
9. **9:00** Pay in test mode; owner's dashboard shows the advance and balance.
10. **10:00** Export the quote as PDF and the data as CSV.

**Time budget:** 10 minutes, no training, no tooltips required.

---

## 6. Kill criteria

Written now so we do not rationalise later.

| Signal | Threshold | Action |
|---|---|---|
| Design partners will not complete a quote unaided | 3 of 5 fail | Stop feature work; fix onboarding or the model |
| Margin view does not change behaviour | 0 of 5 act on it | Re-scope differentiation; consider Strategy C |
| Nobody pays after trial | 0 of 5 convert at ₹499 | Re-price or re-target; do not add features |
| Churn | >5% monthly beyond month 3 | Freeze acquisition; fix retention |
| Support load | >30 min per new customer | Automate onboarding before scaling sales |
| Infra cost | >₹6,000/month before 10 paying customers | Cut non-essential services; audit usage |
| A data-loss or privacy incident | any | Stop releases; write a public post-mortem; fix before resuming |
