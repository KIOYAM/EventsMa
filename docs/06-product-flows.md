# 06 — Product Flows

Every flow below is written as: **trigger → steps → state change → failure handling.**
If a step is not written here, it is not in the MVP.

---

## 1. Actors

| Actor | Can do | Cannot do |
|---|---|---|
| Visitor | Browse public provider pages, submit an enquiry | See any business data |
| Customer (event organiser) | View a quote by token, accept, pay advance, view event updates | See other customers or the business's internal notes |
| Employee | See own shifts, tasks, check-in, leave | See prices, margins, finance, other employees' pay |
| Manager | Everything operational: events, clients, quotes, staff, inventory | Change billing, delete the organisation, change tax identity |
| Owner | Everything, including billing, team, tax settings, export, delete | Access another organisation |
| Platform admin | Tenant list, usage, suspend, impersonate with consent and audit | Read quote contents or customer PII without a logged reason |

Role checks exist in three places and must agree: route guard, server action,
database policy. The database is the authority.

---

## 2. Provider onboarding

**Goal:** a caterer reaches a sendable quote in one sitting. Target: 20 minutes,
median.

```
Signup
  → verify email (or magic link)
  → name + business name + city + phone
  → choose what you do (catering preselected; other verticals optional)
  → add first package (name, per-plate price, minimum guests)
  → add 3 dishes (name, price, unit)
  → set tax mode + advance % + quote validity
  → preview a sample quote
  → "Create your first quote" (or "Explore with sample data")
```

**Rules**

- Steps can be skipped except business name, city, phone and one price. A product with
  no price cannot quote.
- Progress is saved per step; closing the browser does not lose it.
- The "sample data" mode is clearly labelled and removable in one click. It never
  writes into a real quote without confirmation.
- Validation is inline and specific: "Per-plate price must be greater than 0", not
  "Invalid input".
- On completion, the dashboard shows a checklist with two unchecked items at most.

**Failure handling**

| Case | Behaviour |
|---|---|
| Email already registered | Offer sign-in and password reset |
| Verification email not received | Resend with backoff; show support contact after 3 tries |
| Abandoned at step 3 | One reminder email after 24 hours, then stop |
| Duplicate business name | Allowed; slug gets a suffix |

---

## 3. Menu and package setup

```
Menu tab → Add dish
  name, category, unit (per guest | per tray | per counter | per piece)
  price, veg/non-veg, allergens, photo (optional)
  ingredients + quantity per guest (optional, enables margin)
  active toggle
```

**Rules**

- `unit` determines the multiplier at quote time. It is immutable after a quote uses
  the dish; changing it creates a new dish version so old quotes stay correct.
- Price changes never rewrite sent quotes.
- A package references dishes and services by id, not by copied text.
- `min_guests` is enforced in the composer: below minimum, the line shows "Minimum 100
  guests applies" and the total uses the minimum, with an explicit override that
  requires a reason.
- Deleting a dish used by a package is blocked with the list of dependent packages.

---

## 4. Enquiry → quote → booking

### 4.1 States

`enquiry.status`:
`new → contacted → qualified → quoted → won | lost | spam`

`quotation.status`:
`draft → sent → viewed → revised → accepted → expired | declined | cancelled`

Transition rules are enforced server-side. Illegal transitions return 409 with the
allowed next states.

### 4.2 Enquiry intake

```
Customer submits public enquiry (date, guests, occasion, venue, budget, phone)
  → server validates (rate-limited, honeypot, phone format)
  → enquiry row created against the provider org
  → notification: email to owner + WhatsApp deep link pre-filled
  → customer sees confirmation with expected response time
  → follow-up task created for tomorrow
```

| Failure | Behaviour |
|---|---|
| Provider has no capacity that date | Customer sees "limited availability" and can still enquire |
| Email bounces | In-app notification remains; badge on dashboard |
| Duplicate submission within 10 min | Merged, not duplicated (`idempotency_key = phone+date`) |
| Spam | Hidden from dashboard, reported to admin, never emailed to the provider |

### 4.3 Quote creation

```
New quote
  → choose or create client (phone match suggests existing)
  → event basics: date, occasion, guests, venue (address autocomplete)
  → choose package OR build custom selection
  → add extras (live counter, dessert, service staff, rentals)
  → transport (rule-based, editable)
  → discount (optional, reason required above threshold)
  → totals preview (client-side, instant)
  → save draft (server recomputes; mismatch is logged and server wins)
  → preview customer view
  → send
```

**Server authority**

- The client computes a preview for responsiveness only.
- On save, the server recomputes from stored prices and rejects the payload if the
  client total differs by more than ₹1 (a guard against stale price data).
- `quotation_lines` store the rate at the time of sending. Later price changes do not
  affect them.

**Performance requirement:** the composer must respond to a guest-count change within
100 ms on a mid-range phone. No network call per keystroke.

### 4.4 Sending

```
Send
  → server generates number (QT-YYYY-NNNN per org), locks version 1
  → creates signed public token (expires in quote_validity_days)
  → renders PDF (background, cached by content hash)
  → returns a short WhatsApp message + link + PDF
  → owner taps share → native share sheet / wa.me
  → keep the pre-filled message under ~600 characters; wa.me URLs truncate
    long text, so the message names the client, guests, total and validity,
    and the full detail lives behind the link
  → status = sent, sent_at recorded, quotation_version 1 frozen
```

**Failure**

| Case | Behaviour |
|---|---|
| PDF render fails | Send the link anyway; retry PDF in background; never block the send |
| Owner offline | Queue in IndexedDB, show "will send when online", warn if the draft is stale |
| Token leaked | Revoke and reissue; old link shows "quote withdrawn" |
| Quote edited after send | New version, old link stays valid for the accepted version only |

### 4.5 Customer view and acceptance

```
Customer opens /q/<token>
  → sees itemised quote, taxes, total, validity, business contact
  → ticks acceptance, optionally leaves an email → status=accepted, accepted_at recorded
     (no OTP in the MVP; the unguessable token is the access control)
  → sees the business's own bank/UPI instructions; no online checkout
  → sends the transfer reference to the business
  → owner records the receipt manually against the invoice (append-only)
  → accepted quote can be raised as an invoice; event moves to confirmed
```

| Failure | Behaviour |
|---|---|
| Expired token | Read-only view with "Request an updated quote" |
| Already accepted | Show accepted state, not a second accept button |
| Payment succeeds, webhook late | Poll on return; reconcile job every 5 minutes |
| Payment succeeds twice | Idempotency key prevents a second row; refund playbook if it happens |
| Customer disputes | Immutable quote version and payment log are the evidence |

---

## 5. Pricing and calculation flow

This is the heart of the product. It is a pure function, tested exhaustively.

```
Inputs
  package (rate per guest, min guests, inclusions)
  guest count
  selected dishes (rate, unit, quantity)
  extras (fixed or per guest)
  transport (rule result or manual override)
  discount (amount or percent, capped)
  tax settings (per line category, inclusive/exclusive)
  round-off rule

Compute
  1. effectiveGuests = max(guests, package.minGuests) when the package applies
  2. packageAmount  = package.rate × effectiveGuests
  3. for each selected line: amount = rate × quantity × (unit === per_guest ? effectiveGuests : 1)
  4. prevent double count: lines included in the package are shown as "included" and priced at 0
  5. subtotal = packageAmount + Σ line amounts + extras + transport
  6. discount applied after subtotal, never below zero, reason captured
  7. taxableBase = subtotal − discount
  8. tax = Σ (line taxable amount × line tax rate), rounded per line, half-up
  9. total = taxableBase + tax, then round to the nearest rupee
 10. cost = Σ (recipe cost × guests) + staff cost + transport cost + vendor cost
 11. margin = taxableBase − cost ; marginPct = margin / taxableBase
```

**Guarantees**

- Integer paise throughout; formatting only at render.
- `subtotal + tax === total` always, verified by property tests.
- Adding a positive line never decreases the total.
- A negative total is impossible; a discount larger than the subtotal clamps and warns.
- Every number on screen can be traced to a stored line.

**Deliberate limits**

- No multi-currency in MVP.
- No compound taxes.
- No per-guest tiered pricing in MVP (e.g. first 100 at ₹500, next 100 at ₹450). The
  schema leaves room; the UI does not offer it until a customer asks twice.

---

## 6. Event operations

```
Confirmed event
  → operations plan auto-created with a default checklist by occasion
  → assign staff (conflict + availability check)
  → generate purchase list from recipes × guests
  → record vendor commitments
  → event day: today view, check-ins, task completion, offline tolerant
  → close-out: final guest count, extra charges, balance payment, vendor payments
  → event completed → review request → margin recorded
```

**Rules**

- Guest count can change until a configurable cut-off (default 72 hours before).
  After cut-off, changes require owner approval and produce a revision.
- Final invoice uses the final guest count with an audit trail of who changed what.
- Stock movements are written by the system, not typed. Manual adjustments need a
  reason.
- Staff cannot be assigned to two overlapping events; the system blocks it and shows
  the conflict.
- Completing an event requires: final guest count, balance status (paid or explicitly
  written off with a reason), and vendor costs recorded or marked unknown.

---

## 7. Public provider page

```
Provider publishes
  → validation: name, city, at least one package with a price, one photo, contact
  → page rendered statically at /p/<slug>
  → sitemap entry, structured data (LocalBusiness + Service + Offer)
  → enquiry form works without login
  → owner sees views and enquiries (not visitor identities)
```

**Rules**

- No fake reviews: only customers with a completed event token can review.
- Prices shown are a range derived from active packages, updated on publish.
- "Accepting enquiries" toggle controls the CTA and the structured data availability.
- Unpublishing removes from sitemap within one revalidation, returns 410 after 30 days.

---

## 8. Employee flow

```
Employee signs in (email one-time code or a manager-issued magic link;
phone OTP is a paid add-on and is not in MVP)
  → today: next shift, venue, reporting time, tasks
  → check in (timestamp + optional location, offline queued)
  → tick tasks
  → request leave
  → see own attendance history
```

Employee never sees prices, margins, other staff pay, or client phone numbers beyond
what the task requires. This is enforced by RLS, not by hiding a tab.

---

## 9. Subscription and trial flow

```
Signup → Growth trial 14 days, no card
  → day 3: value email with their own quote count
  → day 10: in-app notice, plan comparison
  → day 13: reminder
  → day 14: downgrade to Free (data retained, new quotes limited to 10/month)
  → upgrade → Razorpay subscription → webhook → plan updated → GST invoice
  → payment fails → 7-day grace → read-only → suspend
```

**Rules**

- Never delete data on downgrade. Ever.
- Limits are enforced server-side with a clear message and an upgrade path.
- Cancellation is self-serve and one click, with a reason field.
- Pause for 1–3 months is offered before cancel (seasonality).

---

## 10. Offline and conflict flow

```
Action offline
  → optimistic local apply (IndexedDB, operation log)
  → UI marks "pending sync"
  → on reconnect: replay in order
  → server rejects if version conflict
  → UI shows both versions for the conflicting record, user chooses
  → money operations are never replayed blindly; they require confirmation
```

Scope: quote drafts, task ticks, check-ins, notes. Not payments, not quote sending,
not deletions.

---

## 11. Notifications

| Event | Who | Channel | Timing |
|---|---|---|---|
| New enquiry | Owner, manager | Email + WhatsApp link + in-app | Immediate |
| Quote viewed | Owner | In-app | Immediate, batched per hour |
| Quote accepted | Owner | Email + in-app | Immediate |
| Advance received | Owner, customer | Email receipt + in-app | Immediate |
| Quote expiring | Owner | In-app, then email | 2 days before |
| Balance due | Owner, customer | Email + WhatsApp link | 7, 3, 1 days before event |
| Staff shift | Employee | WhatsApp link + in-app | 24 hours before |
| Trial ending | Owner | Email + in-app | Day 10, 13 |
| Payment failed | Owner | Email | Immediate, retry day 3 |

Rules: transactional only in MVP; one digest per day maximum for non-urgent items;
every notification has an unsubscribe or a preference; no marketing in transactional
email.

---

## 12. Data export and deletion

**Export:** one screen, four buttons (clients, events, quotes, payments), plus a full
JSON archive. Delivered by email link if the archive is large. Must complete in under
60 seconds for 10,000 records.

**Deletion:** request → confirmation email → 7-day grace → soft delete → 30-day
retention for legal/financial records → hard delete of the rest. Financial documents
are retained as required by law; the customer is told exactly what is kept and why.

**Portability is a sales argument.** Put the export button where a prospect can see it
during a demo.

---

## 13. Prototype-to-product migration

The HTML prototype's data is browser-local and not trusted. Migration is therefore a
one-time, opt-in import, not a sync.

```
Caterer still using the prototype
  → exports JSON from the prototype ("Export backup")
  → signs up for the product
  → Settings → Import prototype backup
  → upload → server validates shape and version
  → preview: counts per entity, conflicts, skipped rows
  → confirm → import into their organisation with new ids
  → report: imported, skipped, needs attention
```

Rules: never auto-import; never overwrite existing records; import is idempotent by
content hash; imported records are tagged `source: prototype-import` so support can
trace issues.

---

## 14. Flow acceptance checklist

A flow is complete only when all of these are true:

- [ ] Happy path works on a 390 px phone, one-handed.
- [ ] Empty, loading, error and permission-denied states exist and are designed.
- [ ] Server rejects an invalid state transition (tested).
- [ ] A second tenant cannot read or write the data (tested).
- [ ] Duplicate submission is idempotent (tested).
- [ ] Money maths is server-authoritative and reconciled (tested).
- [ ] Every notification has a retry and a failure path.
- [ ] The flow is instrumented: start, success, failure, drop-off.
- [ ] Support has a written runbook for the three most likely failures.
