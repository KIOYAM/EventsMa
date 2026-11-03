# 11 — Competitive reverse-engineering: what to take, what to skip

Source material: the five engineering studies in the repo root
(`01_BuildMenu`, `02_MealPe`, `03_CateringMenu`, `04_CateringWaala`,
`05_CraftMyPlate`), `Caterease_Full_Technical_Implementation_Guide.md`, and
`EVENTSMA_catering_SaaS_research_and_proof.md`.

**Evidence standard.** Every study states the same limit: these are reconstructions
from public pages, app-store listings and screenshots. Feature *claims* are evidence
that a vendor advertises something, not that it works well. Nothing here was obtained
from private code, authenticated screens or scraped data, and none of it should be
copied as implementation detail — only as a list of problems worth solving.

---

## 1. Who each competitor actually is

| Product | Model | Pricing posture | Strongest engineering idea | Where it is weak |
|---|---|---|---|---|
| **Caterease** | Desktop-first enterprise suite + Horizon Hub web | Quote-based, enterprise | Event vs **sub-event** separation, room/time **scheduler**, Kitchen Display, document builder | Heavy, slow to learn, desktop heritage; not built for a one-person caterer |
| **BuildMenu** | Costing-led management | Subscription | **Recipe → ingredient → yield → plate cost → margin** chain, with cost snapshots | Assumes the caterer has recipe yields and purchase units; most don't |
| **MealPe** | Institutional cafeteria / multi-vendor POS | Enterprise | Order **state machine with guarded transitions**, entitlement decisions that return **reason codes**, settlement + shift reconciliation | Wrong market for us; hardware and institution contracts |
| **CateringMenu** | Single-operator mobile app | Low annual (≈₹5,000/yr) | Mobile-first entry, menu **packages**, auto **material list**, advance/balance visibility, follow-up reminders | Thin client experience; no immutability or revision lineage |
| **CateringWaala** | Operations-heavy booking app | Free core + paid AI tier | **Multiple sessions per booking**, grocery aggregation **across events on the same day**, vendor ledger, godown/utensils | Quote → client journey is secondary; no public storefront |
| **Craft My Plate** | Marketplace / service operator | Per-plate, consumer | **Build-your-own-menu configurator** with live per-plate price, tasting sessions, order status | Operator owns the customer; a caterer cannot use it as their own brand |

---

## 2. The gaps they all share — and our openings

These are the intersections where every study describes the same hole. They are the
reason EventsMa exists in this shape rather than as a clone.

**G1. Catering-only data models.** All five treat "catering" as the schema. Decor,
photography, sound and planning have no representation at all, so a business that sells
two services runs two tools. **Our opening:** verticals as *data*
(`lib/domain/verticals.ts`) with a five-unit pricing vocabulary
(`PER_GUEST | PER_UNIT | FLAT | PER_HOUR | PER_DAY`). One quote, many services. This is
the single most defensible difference and it is already implemented and tested.

**G2. Quotes are mutable or unversioned.** The studies describe "save sent quote" and
"record outcome", but none describes an immutable snapshot with revision lineage.
Caterers get burned when a customer edits a forwarded PDF, or when a price change
silently rewrites history. **Our opening:** `quotation_versions` + `quotation_lines`,
version N never touched, PDF rendered from the frozen snapshot. Already implemented.

**G3. The client is an afterthought.** CateringMenu/CateringWaala are owner apps;
Caterease has a portal but it is an enterprise add-on; Craft My Plate owns the customer.
Almost nobody gives a caterer a **branded client-facing quote link and storefront** that
the caterer controls. **Our opening:** `/q/[token]` with expiry and `/p/[slug]` public
profile + enquiry. Implemented.

**G4. Advance/balance tracking without a ledger discipline.** "Advance/pending payment
tracking" appears as a feature bullet everywhere; none of the studies finds an
append-only payment model with idempotent callbacks. **Our opening:** payments are
append-only, corrections are reversing entries, webhook rows are unique per provider
event. Implemented at the schema and webhook level.

**G5. Zero-fee collection is ignored in the West-facing tooling and half-done locally.**
Craft My Plate and the apps carry gateway economics; nobody surfaces a plain **UPI
intent** for the exact balance. **Our opening:** UPI QR on the quote page for 0%
commission, Razorpay only where cards/links are needed.

**G6. Sessions are a blind spot.** Only CateringWaala and Caterease model multiple
functions per booking. A wedding is lunch + reception + next-morning breakfast, each with
its own headcount, menu and dispatch time. **Our gap too** — this is the highest-value
thing to copy, and it is not yet in our schema.

**G7. No prep sheet derived from the quote.** CateringMenu/CateringWaala generate a
grocery list; Caterease has Kitchen Display; BuildMenu has recipe explosion. We have
nothing. A caterer still retypes the quote into a kitchen list, which is where mistakes
and waste happen.

---

## 3. What to adopt, in order

### Adopt now (cheap, high leverage)

1. **Sessions/sub-events** (from CateringWaala + Caterease). One booking, many functions.
   Each session owns date, time, headcount, service groups, dispatch time. Operational
   quantities are computed per session; money may still total at booking level.
2. **Prep sheet per event date** (from Caterease Kitchen Display, simplified). Aggregate
   confirmed sessions for a date into dish quantities and service counts. No recipes, no
   inventory — just "what to produce and when to leave". This is the feature a caterer
   will pay for on day one.
3. **Enquiry follow-up queue** (from CateringMenu). `next_follow_up_at` plus a today list.
   Cheap, and it is the difference between a lead list and a sales process.
4. **Reason codes for refusals** (from MealPe's entitlement engine, applied to us).
   Availability checks and quote acceptance should return `DATE_BLOCKED`,
   `CAPACITY_EXCEEDED`, `QUOTE_EXPIRED`, not a bare true/false. Keeps support honest.

### Adopt next (needs design)

5. **Guarded status transitions with history** (from MealPe's state machine). Quote and
   booking status become commands with guards and an append-only transition log, not a
   mutable string. We already have the immutable-quote habit; extend it to status.
6. **Document builder lite** (from Caterease). Ours stays a fixed, excellent PDF — but the
   business needs editable terms, a logo and a signature line. Settings, not a template
   engine.

### Defer deliberately

- **Recipe-level yield costing and godown inventory** (BuildMenu, CateringWaala). Correct
  engineering, wrong sequencing: it requires yield and purchase-unit data a 3-person
  caterer does not maintain. Revisit when tenants ask for margin per dish.
- **Staff shifts, utensils, vendor ledgers, P&L** (Caterease, CateringWaala). That is ERP
  territory and it fights our "90-second quote" focus.
- **AI capture from photos/voice** (CateringWaala). A paid tier feature with a paid API
  bill and a review burden; it does not improve the core loop yet.
- **Marketplace / discovery** (Craft My Plate). Conflicts with the white-label promise
  and with the "no leads claim" rule in AGENTS.md §5.
- **Multi-language, BI dashboards, scheduled reports.** Real, but not before retention.

---

## 4. How to enhance rather than copy

- **Sessions + multi-vertical is a combination none of them have.** A wedding's lunch is
  catering (per guest), the reception decor is per unit, the photographer is per day. If
  sessions land in the schema, one booking can hold all three with correct units per
  line — no competitor in this set can express that.
- **Prep sheet from the same immutable version the client saw.** Caterease's KDS is fed by
  the event record; ours can be fed by the *sent* version, so the kitchen and the client
  never disagree. That is a stronger guarantee than any of the five.
- **UPI-first collection with a ledger.** Keep the zero-fee path primary and gateway
  secondary, and record both in the same append-only table. Locally this is a real
  advantage over app-store SaaS that assumes cards.
- **Public profile as the acquisition surface, not a marketplace.** A caterer shares
  `/p/slug`; the enquiry lands in their workspace with the phone deduped. They own the
  customer, which is exactly what Craft My Plate does not offer.

---

## 5. Risks of this direction

| Risk | Why it bites | Mitigation |
|---|---|---|
| Scope creep into ERP | Every study lists 20+ modules; copying them delays the quote loop | Only adopt items 1–4 now; everything else needs a design doc first |
| Session model retrofits badly | Adding `event_sessions` after quotes exist means migrating lines | Decide before the first real tenant; add nullable `session_id` now |
| Prep sheet drifts from quote | Two sources of truth | Generate only from a sent `quotation_version`, never from live draft lines |
| Competitor parity claims | Public pages are marketing, not proof | Never claim a feature they have until ours is tested; AGENTS.md §5 |
| RLS still unexecuted | Every tenant claim above is theoretical until policies run | Block any shared deployment until the two-tenant test passes |

---

## 6. Concrete next schema decisions (design only, no code yet)

- `event_sessions (id, org_id, quote_id, kind, starts_at, ends_at, guests, dispatch_at)`
  with `quotation_lines.session_id` nullable.
- `prep_items` as a **derived** read model keyed by `(org_id, service_date, dish_key)`,
  rebuilt from sent versions — never hand-edited.
- `enquiries.next_follow_up_at` + `status` (`new | contacted | quoted | won | lost`).
- `availability_holds (org_id, service_date, capacity_units, expires_at)` so a quote can
  reserve a date without blocking the calendar forever.

Each of these gets a `docs/designs/<slug>.md` before implementation, per AGENTS.md §4.

---

## 7. Verdict

The studies are more useful as a **map of shared failure** than as a feature list. Their
strengths are operational depth (sessions, prep, ledgers); their shared weakness is that
none of them treats the quotation as a legal-ish document with lineage, and none of them
can describe a business that sells more than food.

Take sessions and the prep sheet. Keep the immutable quote, the multi-vertical engine and
the client-facing link, which are already ahead. Skip the ERP.
