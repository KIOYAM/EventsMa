# 02 — Gaps, Client Experience and Improvements

Two audiences are analysed separately because they fail differently:

- **The caterer** (our paying customer) — loses time and money.
- **The caterer's customer** (the family or company booking an event) — loses trust
  and certainty.

A gap is only real if it costs one of them money, time or confidence. Every row below
names the evidence and the fix.

Severity: **P0** blocks paying customers · **P1** blocks growth · **P2** hurts conversion
or retention · **P3** polish.

---

## 1. Business-model gaps

| ID | Gap | Evidence | Impact | Severity | Fix |
|---|---|---|---|---|---|
| B1 | The prototype implies a working marketplace that does not exist (220 synthetic providers) | `FF_MKT_DEMO_COUNT=220`, `sample:true`, `verifiedDemo:true` | A caterer or investor may believe demand exists; a real customer searching finds fake businesses. Reputation damage. | P0 | Ship public profile pages only. Label demo data as demo in every non-production environment. Never index synthetic listings. |
| B2 | No way to charge for the product | Plans exist as labels (`Starter`, `Professional`, `Trial`); no subscription, invoice, trial or dunning | No revenue; no way to test willingness to pay | P0 | Manual plan invoices + 14-day Growth trial + plan limits enforced server-side (no payment gateway in MVP) |
| B3 | Value proposition is split between two incompatible stories ("manage your business" vs "get more customers") | Auth screen copy and marketplace copy disagree | Buyers cannot repeat what we do; demos wander | P0 | One sentence: quote fast, know your margin. Public profile is a feature, not the promise |
| B4 | Free alternatives are credible (CateringMenu free, Ziyafat open source) | Vendor pricing pages, Oct 2026 | Price cannot be the reason to switch | P1 | Win on quote speed + margin + mobile; free tier limited but genuinely useful |
| B5 | No written validation with real caterers | Research file's own next-steps list is unchecked | All pricing and workflow assumptions are unproven | P0 | 5 design partners, structured interviews, watch them quote |
| B6 | No clear ICP boundary | "Catering businesses and related event-service businesses" is too broad | Sales and product both sprawl | P1 | Start: 3–30 events/month, owner-operated, one district, Android |
| B7 | Seasonal revenue model unaddressed | Wedding seasonality is obvious; plans are monthly | Churn spikes in lean months; cash flow breaks | P1 | Annual plan, seasonal pause, lean-month features (corporate lunches, small functions) |
| B8 | No data/insight product | Every quote and cost passes through us | Leaves the most defensible asset unused | P2 | Later: anonymised per-plate benchmarks by district and occasion |
| B9 | Support cost per customer unknown | No onboarding playbook | Gross margin may be much lower than modelled | P1 | Measure minutes-to-activate; cap onboarding slots |
| B10 | Dependency on a single founder for sales and onboarding | Nothing documented | Growth stops when the founder is busy delivering | P2 | Onboarding checklist + 3 short videos + in-product checklist |

---

## 2. Product gaps (functional)

| ID | Gap | Evidence in prototype | Impact | Severity | Fix |
|---|---|---|---|---|---|
| P1 | No backend or multi-device sync | localStorage only | Team cannot collaborate; phone and laptop disagree; data dies with the browser | P0 | Supabase Postgres + Auth + RLS |
| P2 | Quotes are printable HTML, not documents | `quoteHtml()` opens a new window | No version, no acceptance, no expiry enforcement, no audit | P0 | `quotation` + `quotation_version` tables, immutable PDF snapshot, accept link |
| P3 | No real payment collection | "Record payment" only writes a number | Owner chases cash manually; no proof of payment | P0 | Manual bank/UPI instructions, append-only receipt rows and reconciliation screen (gateway deliberately deferred) |
| P4 | Enquiry never reaches a provider | `ffMktSaveProviderInquiry` writes to local demo workspace | Customer believes they enquired; nobody responds | P0 | Server-side enquiry + email/WhatsApp notification + SLA timer |
| P5 | No availability or capacity check | Calendar displays events only | Double booking, over-capacity kitchen, staff shortage | P0 | Date-level availability, capacity per day, conflict warnings |
| P6 | No margin/cost on the quote | Recipes and unit costs exist but are unused | Owner cannot see profit before committing | P0 | Recipe → plate cost → quote contribution, with a margin warning |
| P7 | Distance/transport not calculated | Transport is a typed field | Inconsistent pricing; underpriced far venues | P1 | Cached route distance + business rule + manual override |
| P8 | Tax model too simple | One `taxRate` on the total | Wrong invoices, GST disputes | P1 | Per-line tax category, inclusive/exclusive, round-off, place-of-supply |
| P9 | Inventory not connected to events | Stock edited manually; recipes unused | Ingredient lists are theatre, not operations | P1 | Event → requirement explosion → purchase list → stock movement |
| P10 | Staff assignment has no conflicts or wage cost | Assignment writes an object | Double-shifted staff; unknown labour cost | P1 | Overlap detection, role rates, shift cost roll-up |
| P11 | No notifications of any kind | Toasts only | Follow-ups missed; quotes ignored; payments late | P1 | Email + WhatsApp deep links + in-app; later Cloud API |
| P12 | Search is client-side over all rows | `filtered()` on full arrays | Slow at scale; cannot do geo or fuzzy | P1 | Postgres full-text + trigram, indexed filters, cursor pagination |
| P13 | No public, indexable provider pages | Hash routes inside one file | Zero organic discovery; no SEO | P1 | SSR/ISR route per provider, sitemap, structured data |
| P14 | Reviews are unverified and unauthenticated | `openPublicReview` publishes immediately | Fake reviews destroy trust | P2 | Review only against a completed event token; moderation queue |
| P15 | No file/document management | Images compressed into the JSON blob | Blob bloat, slow loads, no CDN, no delete | P1 | Supabase Storage/R2 with signed URLs and size limits |
| P16 | No offline behaviour | Everything requires the page | Field staff lose access at venues with poor network | P1 | PWA shell + IndexedDB draft queue for quotes and check-ins |
| P17 | No audit trail that survives the browser | `ffLog` capped at 250 local entries | Cannot investigate disputes or mistakes | P1 | Append-only `audit_event`, actor, before/after diff |
| P18 | No subscription metering | Plans are labels | Free users can use Pro features | P0 | Server-side plan limits and usage counters |
| P19 | No multi-branch | One business per org | Limits larger customers | P2 | Branch entity under organisation |
| P20 | No import from Excel/WhatsApp | Bulk import is a mock toast | Setup is manual; caterers abandon | P2 | CSV/XLSX menu and client import with validation preview |

---

## 3. Client-experience gaps (the caterer's customer)

This is the journey a family actually has. Each step names what the prototype does and
what it should do.

| Step | What the customer wants | Prototype today | Gap | Improvement |
|---|---|---|---|---|
| 1. Discover | Find a caterer who serves their area and occasion | Search over 220 fake profiles with no availability filter | Results are not real and cannot be trusted | Real claimed listings with "accepting enquiries" status; show last response time |
| 2. Judge | Decide if this caterer is credible and within budget | Profile with packages, photos, reviews | Prices may be hidden; reviews unverified; no recent-work dates | Show real per-plate range, sample menus with prices, event count in last 12 months, verified reviews |
| 3. Check fit | "Can you do 350 guests, pure veg, at this venue on 12 Feb?" | Enquiry form with date/guests | No availability answer; no instant estimate | Instant indicative price range + "date available / limited / booked" before asking for details |
| 4. Enquire | Send requirements without repeating themselves | Form writes to local storage | Nobody receives it; no confirmation | One-tap enquiry via WhatsApp with a pre-filled summary; visible status and response promise |
| 5. Receive quote | Understand what is included and why the price is that | Printable page or PDF | No breakdown by dish, no tax clarity, no transport line explanation | Itemised quote page: dish, unit, quantity, rate, amount; taxes separate; transport rule stated |
| 6. Compare | Compare two caterers fairly | None | Family screenshots quotes into WhatsApp | Save/compare multiple quotes side by side; share a plan link with family |
| 7. Decide | Accept and pay advance without friction | Nothing | Bank transfer screenshot chaos | Accept button + payment link + instant receipt |
| 8. Coordinate | Know what happens next | Nothing | Repeated phone calls about timing, menu changes, guest count | Shared event page: timeline, final guest count deadline, contacts |
| 9. Event day | Confidence that the team will arrive | Nothing | Anxiety | "Team assigned, ETA, live status" — a small but high-emotion feature |
| 10. After | Leave a review; get an invoice | Unauthenticated review form | Spam risk; no invoice | Review token after event; GST invoice download |

**The single biggest client-experience improvement** is step 3+5: give an indicative,
itemised price before a phone call, and an itemised quote afterwards. Everything else
is secondary.

**The single biggest trust gap** is step 4: an enquiry that silently goes nowhere. If
we ship only one integration, it is delivery of the enquiry to the caterer on
WhatsApp/email with a confirmation to the customer.

---

## 4. Client-experience gaps (the caterer, at work)

Observed from the prototype and the prior research. Each is phrased as the moment it
hurts.

1. **Creating a quote.** 20+ fields, no template, no "copy last wedding", no keyboard
   shortcut. A repeat customer still starts from zero. → Quote from a previous event
   in one tap; duplicate as template; default last-used values.
2. **Typing on a phone.** Desktop tables, 9–10 px text, horizontal scrolling, tiny
   icon buttons. → Mobile-first quote composer, 44 px targets, bottom sheet pickers.
3. **Sharing.** "Copy link" plus a note that hosting is needed. → Native share sheet,
   WhatsApp pre-filled message, PDF fallback, 3 taps maximum.
4. **Following up.** Leads are listed but nothing reminds anyone. → Follow-up date,
   overdue queue, one-tap "send reminder".
5. **Changing a quote.** No revision concept; editing overwrites. → Versioned quotes,
   diff view, "send revision 2".
6. **Deposit confusion.** Advance percent is a setting, not enforced. → Advance rule
   applied automatically, shortfall shown on the event.
7. **Event day.** Tasks and vendors live in a board nobody opens on a phone. → Today
   view, big checkboxes, offline tolerant.
8. **Month end.** Reports need interpretation; no receivables ageing. → "Who owes me
   money, for how long" list, exportable.
9. **Staff.** Assignments exist but no conflict, no wage total, no attendance truth.
   → Shift conflict, cost, check-in with timestamp/location.
10. **Setup.** Guided onboarding is three informational modals. → Data-quality gates:
    at least one package with a price, one venue area, one tax setting before "go live".

---

## 5. Technical and trust gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| T1 | Plaintext passwords, resettable by anyone with the browser | P0 | Supabase Auth; never store credentials; email verification + magic link option |
| T2 | Role checks are DOM visibility only | P0 | Postgres RLS policies per organisation and role; test with two tenants |
| T3 | All data in one JSON blob per org | P1 | Normalised tables, partial updates, transactions |
| T4 | No backup, no point-in-time recovery on free tier | P1 | Daily export to object storage; documented restore drill; Pro plan for real backups |
| T5 | No idempotency on payments or writes | P1 | Idempotency keys, unique constraints, server-side totals |
| T6 | Numbers computed in the browser | P1 | Authoritative totals computed server-side; client shows preview only |
| T7 | "LIVE" badge with nothing hosted | P2 | Derive status from real publication state |
| T8 | English-only UI, dense copy | P1 | Tamil + Hindi for field roles; plain language |
| T9 | No error monitoring or analytics | P1 | Sentry free tier + privacy-respecting product analytics |
| T10 | No consent or data-deletion path | P1 | Consent at signup, export, delete-on-request workflow |
| T11 | Demo credentials in shipped files | P0 | Never ship seeded accounts to production; gate by environment |

---

## 6. Improvements ranked (impact ÷ effort)

The order we should actually work in. Effort is engineering days, T-shirt sized.

| Rank | Improvement | Why now | Effort | Impact |
|---|---|---|---|---|
| 1 | Real auth + tenant isolation | Nothing else can be sold without it | 4–6 days | Unblocks everything |
| 2 | Quote composer + server totals + share link | The core job | 8–12 days | The product |
| 3 | Enquiry delivery (email + WhatsApp link) with confirmation | Prevents the worst trust failure | 3–4 days | Trust |
| 4 | Menu/package CRUD with units and images | Table stakes in every competitor demo | 5–7 days | Activation |
| 5 | Client + event records with status pipeline | Needed for quote context | 4–5 days | Retention |
| 6 | Payment link + advance tracking + receipt | Directly tied to the owner's cash pain | 5–7 days | Willingness to pay |
| 7 | Margin view (recipe cost → quote contribution) | The differentiator versus free tools | 6–8 days | Differentiation |
| 8 | Mobile-first shell + PWA offline draft | Field reality | 5–8 days | Adoption |
| 9 | Public provider page (SSR, SEO) | Credibility and a future discovery layer | 4–6 days | Distribution |
| 10 | Follow-up queue and reminders | Stops revenue leaking | 3–4 days | Retention |
| 11 | Inventory → event requirement explosion | Real operations value | 8–10 days | Upsell to Pro |
| 12 | Distance-based transport with cache | Validated pain, but needs an API budget | 4–6 days | Pricing accuracy |

Items 13+ (multi-branch, marketplace comparison, reviews moderation, benchmarks) wait
for evidence.

---

## 7. What not to improve

Saying no is part of the design.

- **Do not** build a full accounting suite. Integrate or export.
- **Do not** build a consumer app before provider supply exists.
- **Do not** support every one of the 20 verticals on day one. Ship catering deeply,
  keep the vertical model in the schema, expose 3 verticals at launch.
- **Do not** chase feature parity with JUCAS. Its breadth is its sales pitch and its
  onboarding cost.
- **Do not** add AI-generated menus or pricing before the deterministic calculator is
  trusted. A wrong number costs a caterer a real contract.
