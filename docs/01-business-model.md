# 01 — Business Model

**Status:** Hypothesis. Nothing in this document is validated with a paying caterer yet.
**Rule:** every number is labelled FACT, ASSUMPTION or DECISION.

---

## 1. The problem, stated plainly

A small caterer runs a ₹15–80 lakh/year business from a phone, a notebook and WhatsApp.
For every enquiry they rebuild the same menu, the same per-plate arithmetic, the same
transport guess and the same advance request. The quote is a photo of a page or a
typed message. When the event ends, nobody knows the true margin.

The pain is not "no software". The pain is **repeat work and invisible money**:

1. Same menu and price data re-entered for every enquiry.
2. Cost changes (paneer +₹40/kg) do not flow into prices.
3. Transport pricing is a feeling, not a rule.
4. Advances and balances live in a diary.
5. Profitability per event is unknown until the year ends, if ever.
6. Follow-ups are forgotten, so warm leads go cold.

**FACT (from prior research):** these workflow steps are a working model, not a
validated universal. The research file explicitly says to test them with 3–5 real
caterers before treating them as market facts.

---

## 2. Who we sell to

| Persona | Who they are | What they need in one sentence | Will they pay? |
|---|---|---|---|
| **Owner-caterer** (primary) | Runs 3–30 events/month, 2–20 staff, does quotes personally, Android phone | "Give me a quote in 5 minutes from WhatsApp, and tell me what I actually earned" | Yes, if it saves quoting hours or prevents one underpriced event |
| **Manager / supervisor** | Runs operations, staff rosters, vendors | "Tell me what is due today and who is responsible" | Indirect (owner pays) |
| **Field employee** | Service crew, kitchen, drivers | "Show my shift, my tasks, my check-in" | No; must be free and login-light |
| **Event customer** (demand side) | Family or company booking an event | "Show me real prices, availability and let me confirm without ten calls" | No subscription; may pay a booking advance |
| **Platform admin** | Us | "See tenants, usage, failures, abuse" | Internal |

**DECISION — wedges.** Phase 1 sells to the owner-caterer only. The customer-side
portal exists to make the caterer look professional and to close quotes, not to
acquire consumers at scale.

---

## 3. Jobs to be done, ranked by willingness to pay

| Rank | Job | Today | Our answer | Evidence it matters |
|---|---|---|---|---|
| 1 | Produce a correct, attractive quote fast | Rebuild in notebook/Excel/WhatsApp | Template + package + guest count → quote in under 90 seconds, share on WhatsApp | Research: "quotation must be rebuilt manually for each enquiry" (unvalidated, high confidence) |
| 2 | Protect margin when costs move | Memory and gut feel | Ingredient cost → dish cost → package margin, warning before sending | Research: per-plate prices hard to update when costs change |
| 3 | Get paid on time | Diary, reminders | Advance rule, payment link, balance reminder, ledger | Research: advances and balances hard to track |
| 4 | Not double-book a date | Diary and memory | Availability + capacity check per date | ASSUMPTION, needs validation |
| 5 | Know which events made money | Year-end accountant | Per-event contribution after food, staff, transport, vendors | Research: owner cannot see profitable events |
| 6 | Look credible to a customer | WhatsApp PDF | Branded quote page with accept button | ASSUMPTION |
| 7 | Find new customers | Referrals, Google | Not in Phase 1. Public profile pages are a bridge, not a marketplace | Research: do not claim demand we do not have |

---

## 4. Competitive reality and price anchors

**FACT — published prices, checked October 2026.** Vendor pages, not independent
audits.

| Product | Published price | What it appears to include | Source |
|---|---|---|---|
| CateringMenu | Free (10 quotes/month) · ₹4,999/yr Basic (≈₹417/mo) · ₹15,999/yr Pro (≈₹1,333/mo) | Quotes, invoices, menus, payments tracking; Pro adds material lists, CRM, staff, referrals | cateringmenu.in |
| JUCAS | ₹24,000 first year, ₹8,000/yr after; Accounts add-on ₹12,000 first year; messaging add-on ₹5,000/yr; mobile app ₹3,999/yr; 3 users included, extra user ₹1,500/yr | Orders, menus, labour/material distribution, quotations/invoices, accounts, payroll, stock | myjucas.com/pricing |
| CateringWaala | Reported lifetime free core; Standard ₹599/month for AI features (not independently confirmed) | Bookings, menus, vendor payables, staff, inventory, expenses, AI ingredient calculation | cateringwaala.com + App Store listing |
| CaterTrack | ₹799/month (unverified) | 1 business, 3 team members, 50 orders/month | catertrack.in/pricing |
| Ziyafat | Free (open source) | Leads, bookings, quotations, invoices, menu | getziyafat.vercel.app |

**What this tells us**

1. The willingness-to-pay ceiling for a small Indian caterer is roughly
   **₹400–1,300 per month**, and several credible tools sit at or near zero.
2. A ₹24,000 first-year price (JUCAS) is sold as a full operations system with
   accounts, not as a quote tool. That is the ceiling, not the entry point.
3. Nobody in this list has a defensible consumer-demand marketplace. The discovery
   layer is open, but expensive to build.
4. "Free" competitors are real. We cannot win on price. We must win on **time to a
   sent quote**, **margin visibility** and **mobile experience**.

**Market size caveat (FACT):** published estimates conflict badly. A 2016 trade-body
quote says "over 2 million caterers"; MarkNtel puts India wedding catering at
US$16.19 bn (2025) while IMARC puts the *entire* India catering services market at
US$5.3 bn (2025). Those cannot both be right. **Do not put a market-size number in an
investor or partner deck without reconciling definitions.** Use bottom-up counts from
our own onboarding pipeline instead.

---

## 5. Positioning

> **"Quote in 5 minutes. Know your margin before you send it."**

- Not an ERP. Not a marketplace. A **quotation and margin tool for caterers**, with
  the operations board attached so the same data survives the event.
- Mobile-first, WhatsApp-native, works on a ₹12,000 Android phone.
- Own your prices and your customer list. We never resell your clients.
- Public profile page included, so a caterer can replace a dead link in their
  Instagram bio — but no promise of leads.

**Counter-positioning against the field:** the incumbents sell "manage your whole
business", which means weeks of setup and data entry. We sell the one screen they use
five times a day, then grow into the rest.

---

## 6. Pricing hypothesis

**DECISION — start with a free tier that is genuinely useful, because competitors
give away quote tools.**

| Plan | Price (hypothesis) | Included | Purpose |
|---|---|---|---|
| Free | ₹0 | 1 user, 5 quotes/month, unlimited clients, branded quote link, 1 public profile, **no margin view** | Replace the "free" competitor; remove the reason to say no, while leaving a concrete reason to upgrade |
| Growth | ₹499/month or ₹4,999/year | Unlimited quotes, 3 users, packages, WhatsApp share, payment link, **margin view**, follow-up queue | Core revenue plan; undercuts CateringMenu Basic annually and beats it on margin features |
| Pro | ₹999/month or ₹9,999/year | 10 users, inventory + recipes, operations board, vendor ledger, reports, priority support | Matches what JUCAS charges in year 2+ but without the ₹24,000 entry |
| Business | ₹1,999/month | Multi-branch, roles/permissions, API, custom domain, data export, SLA | Later; only after inbound demand exists |

Why ₹499: it is below the psychological ₹500 line, roughly 1% of a small caterer's
monthly revenue, and cheaper per month than one wasted staff shift. Annual pricing at
10 months' price is the default offer because it reduces churn and seasonal lapse.

Why the margin view is paid and the quote is free: a caterer who sends five quotes a
month is not the customer we need yet, and giving away the differentiator makes the
upgrade a matter of convenience rather than value. Free wins the comparison; margin
wins the subscription. Watch the free-to-paid conversion of users who hit the fifth
quote — if they do not upgrade, the limit is wrong, not the pricing.

**ASSUMPTION — GST.** Prices quoted exclusive of 18% GST for Indian customers.
Software exports are zero-rated, but our first customers are domestic. Confirm
treatment with a CA before the first invoice. Do not hard-code tax in the product.

**ASSUMPTION — payments.** Razorpay/PhonePe standard card/UPI fee around 2% plus GST.
At ₹499, the fee is about ₹10–12. Fine. At ₹99 it would not be.

---

## 7. Unit economics (bottom-up, labelled)

All figures are **ASSUMPTION** unless marked. This is a model to test, not a forecast.

| Line | Free user | Growth | Pro |
|---|---|---|---|
| Monthly price | ₹0 | ₹499 | ₹999 |
| Payment fee (2% + GST) | ₹0 | ₹12 | ₹24 |
| Hosting cost per business (at 1,000 tenants) | ₹8 | ₹12 | ₹25 |
| WhatsApp/email notification cost | ₹3 | ₹8 | ₹15 |
| Support cost (blended, 0.15 tickets/user/mo) | ₹2 | ₹20 | ₹45 |
| **Gross margin** | negative, small | **≈₹447 (90%)** | **≈₹890 (89%)** |

**Break-even on the first paid infrastructure step**

| Item | Monthly |
|---|---|
| Vercel Pro | $20 ≈ ₹1,760 |
| Supabase Pro | $25 ≈ ₹2,200 |
| Domain, email, monitoring | ≈₹1,500 |
| **Total** | **≈₹5,460** |

At ₹499 Growth, that is **11 paying customers** to cover infrastructure. At a blended
₹650 ARPU, **9 customers**. This is the entire budget case: the free tier carries us
until roughly 300–500 active businesses, after which usage limits, not price, force
the upgrade.

**CAC reality (ASSUMPTION):** direct sales to caterers in Coimbatore/Tamil Nadu costs
roughly ₹1,500–4,000 per paying customer (travel, demo time, WhatsApp follow-up,
onboarding help). Payback at ₹450 gross margin is 4–9 months, which is acceptable
only if annual churn stays under 30%. If churn is 5%/month, nothing works.

**OPEN — the single most important number:** monthly logo churn. Catering is
seasonal; a caterer may pay for 8 months and lapse for 4. Design for annual plans and
seasonal pause, not for monthly subscriptions we then chase.

---

## 8. Go-to-market

**Phase 1 (0–50 customers): founder-led, geography-first.**

- Pick one cluster (Coimbatore + nearby towns) where referrals travel fast.
- Recruit 5 design partners who get Pro free for 6 months in exchange for weekly
  feedback and permission to use their real menu/price data (with consent).
- Onboard in person or on a screen-share. Watch them build their first quote. Fix
  the top three frictions weekly.
- Content that ranks: "catering quotation format in Tamil Nadu", "per-plate cost
  calculator", "wedding catering menu price list template". Free tools that feed the
  product.
- WhatsApp status and local caterer association groups matter more than Instagram.

**Phase 2 (50–500): referral and templates.**

- In-product referral: a caterer's quote page carries "Powered by" branding.
- Menu/package template library by region and occasion (a real moat over time).
- Partner with wedding planners and venue managers as distribution.

**Phase 3: demand marketplace — only when supply density exists.**

- Minimum bar: 30+ verified, responsive providers in one city with real availability.
- Without that, a marketplace is a search page that disappoints customers and
  embarrasses the caterer. This is why Phase 1 does not promise leads.

**Do not do:** paid ads before retention is proven; discounting annual plans below
₹4,999; signing large caterers who demand custom work before the core is stable.

---

## 9. Moat, such as it is

1. **Regional pricing data** — anonymised, aggregated per-plate ranges by occasion and
   district. Nobody else is collecting this from small caterers.
2. **Workflow lock-in that is earned, not trapped** — once menus, recipes, clients and
   past quotes live here, switching cost is real but export is allowed.
3. **Mobile speed** — a 1.5-second quote screen on a cheap phone is hard to copy from
   a legacy desktop product.
4. **Multi-vertical service model** — a caterer who also does decor or photography can
   keep both books in one place. Incumbents bolt this on badly.

There is no network effect in Phase 1. Say so plainly.

---

## 10. Risks that can kill this

| Risk | Why it matters | Mitigation |
|---|---|---|
| Caterers will not pay for software | Free tools and notebooks exist | Charge from day one for Growth; free tier capped; prove time saved with a stopwatch in demos |
| Seasonal churn | Wedding season vs lean months | Annual plans, pause instead of cancel, revenue from inventory/ops in lean months |
| WhatsApp dependency | The real channel is WhatsApp; API costs and policy change | Start with `wa.me` deep links (free, no API); add Cloud API only when volume justifies it |
| One bad data-loss incident | Local notebook is trusted; software that loses a quote is not | Backups from day one, soft delete, audit log, export |
| Marketplace scope creep | The prototype looks like a marketplace; demand does not exist yet | Public profiles only, no promise of leads, gate marketplace behind supply density |
| Price war with free competitors | CateringMenu free tier is real | Compete on margin + speed, not features per rupee |
| Compliance | GST invoices, payment records, data retention | Consult a CA; keep financial documents immutable |
| Founder bandwidth | Docs are cheap, support is not | Cap onboarding at 5/week until playbook exists |

---

## 11. What must be true for this to work

1. A caterer can produce and send a quote in under 2 minutes, on a phone, without
   training. (Test: watch 5 caterers, measure.)
2. At least 3 of 5 design partners say the margin view changed a price they would
   have quoted. (Test: before/after quote comparison.)
3. At least 2 of 5 pay ₹499/month after the free period without discount.
4. Monthly churn below 3% in the first cohort, or a seasonal annual plan that
   survives the off-season.
5. Infrastructure stays under ₹6,000/month until 10 paying customers exist.

If (1) or (3) fails, the business model is wrong, not the marketing.
